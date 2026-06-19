"""
PRAL e-Invoice API Service
Federal Board of Revenue (FBR) — Pakistan

This module handles submission of Sales Tax Invoices to PRAL's
Integrated Tax Management System (ITMS) e-Invoice API.

Required environment variables in .env:
    PRAL_POS_ID       — POS ID assigned by PRAL after registration
    PRAL_USERNAME     — API username from PRAL ITMS portal
    PRAL_PASSWORD     — API password from PRAL ITMS portal
    PRAL_POS_SERIAL   — POS serial number registered on PRAL
    PRAL_ENV          — 'sandbox' or 'production'

Documentation:
    PRAL ITMS Portal : https://itms.fbr.gov.pk
    FBR e-Invoice    : https://www.fbr.gov.pk/einvoicing
    PRAL Helpline    : 051-111-772-527
"""

import os
import json
import logging
import requests
from datetime import datetime, timezone
from decimal import Decimal

logger = logging.getLogger(__name__)

# ── PRAL API endpoints ────────────────────────────────────────────────────────
_ENDPOINTS = {
    'sandbox':    'https://esp.fbr.gov.pk:8244/ESB/v1',
    'production': 'https://esp.fbr.gov.pk:8244/ESB/v1',
}

_TIMEOUT = 30  # seconds


def _env():
    return os.environ.get('PRAL_ENV', 'sandbox').lower()


def _base_url():
    return _ENDPOINTS.get(_env(), _ENDPOINTS['sandbox'])


def _credentials_configured():
    return all([
        os.environ.get('PRAL_POS_ID'),
        os.environ.get('PRAL_USERNAME'),
        os.environ.get('PRAL_PASSWORD'),
    ])


# ── Token cache (in-memory, per process) ─────────────────────────────────────
_token_cache = {'token': None, 'expires_at': None}


def _get_auth_token():
    """
    Obtain a Bearer token from PRAL's auth endpoint.
    Tokens are cached in memory until expiry.
    """
    now = datetime.now(timezone.utc)

    if _token_cache['token'] and _token_cache['expires_at']:
        if now < _token_cache['expires_at']:
            return _token_cache['token']

    url = f"{_base_url()}/auth/token"
    payload = {
        'username': os.environ.get('PRAL_USERNAME', ''),
        'password': os.environ.get('PRAL_PASSWORD', ''),
        'posId':    os.environ.get('PRAL_POS_ID', ''),
    }

    resp = requests.post(url, json=payload, timeout=_TIMEOUT, verify=True)
    resp.raise_for_status()
    data = resp.json()

    token = data.get('access_token') or data.get('token')
    if not token:
        raise ValueError(f"PRAL auth response missing token. Response: {data}")

    # Cache for 50 minutes (tokens typically expire in 60)
    from datetime import timedelta
    _token_cache['token'] = token
    _token_cache['expires_at'] = now + timedelta(minutes=50)

    return token


def _build_payload(invoice, company):
    """
    Build the JSON payload for PRAL e-Invoice API.
    Field names follow PRAL's official XML/JSON schema.
    """
    items = []
    for item in invoice.items.select_related('pct_code').all():
        qty      = float(item.quantity)
        rate     = float(item.rate)
        excl_tax = float(item.value_excl_tax)
        tax_amt  = float(item.sales_tax_amount)
        incl_tax = float(item.value_incl_tax)
        tax_rate = float(item.sales_tax_rate)

        items.append({
            'ItemDescription': item.description,
            'HSCode':          item.pct_code.pct_code if item.pct_code else '',
            'Quantity':        qty,
            'UnitPrice':       rate,
            'TotalAmount':     excl_tax,
            'TaxRate':         tax_rate,
            'TaxCharged':      tax_amt,
            'TotalValueAddedTax': tax_amt,
            'ValueOfGoodsIncludingTax': incl_tax,
        })

    total_excl = float(sum(item.value_excl_tax for item in invoice.items.all()))
    total_tax  = float(sum(item.sales_tax_amount for item in invoice.items.all()))
    total_incl = float(sum(item.value_incl_tax for item in invoice.items.all()))

    return {
        'InvoiceNumber':         invoice.invoice_number,
        'InvoiceDate':           invoice.date.strftime('%d/%m/%Y'),
        'InvoiceType':           'SI',   # SI = Sales Invoice
        'STRN':                  getattr(company, 'str_number', ''),
        'NTN':                   getattr(company, 'ntn_number', ''),
        'BusinessName':          getattr(company, 'name', ''),
        'Address':               getattr(company, 'address', ''),
        'BuyerName':             invoice.customer.name,
        'BuyerAddress':          invoice.customer.address,
        'BuyerSTRN':             invoice.customer.str_number or '',
        'BuyerNTN':              invoice.customer.ntn or '',
        'TotalBillAmount':       total_excl,
        'TotalSalesTax':         total_tax,
        'TotalAmountWithTax':    total_incl,
        'PaymentMode':           'Cash',
        'POSId':                 os.environ.get('PRAL_POS_ID', ''),
        'POSSerialNo':           os.environ.get('PRAL_POS_SERIAL', ''),
        'Items':                 items,
    }


def submit_invoice(invoice):
    """
    Submit a single Invoice to PRAL's e-Invoice API.

    Returns a dict:
        {
            'success':     True | False,
            'irn':         'FBR-IRN-...',   # on success
            'qr_code':     'https://...',   # on success
            'error':       'message',       # on failure
        }

    This function NEVER raises — all errors are caught and returned
    in the result dict so callers can handle gracefully.
    """
    if not _credentials_configured():
        return {
            'success': False,
            'error':   'PRAL credentials not configured. Add PRAL_POS_ID, PRAL_USERNAME, PRAL_PASSWORD to your .env file.',
        }

    try:
        # Load company settings
        from apps.core.models import CompanySettings
        company = CompanySettings.objects.first()
        if not company:
            return {'success': False, 'error': 'Company settings not configured.'}

        if not company.str_number:
            return {'success': False, 'error': 'Company STR# not set. Add it in Settings → Company.'}

        # Get auth token
        token = _get_auth_token()

        # Build payload
        payload = _build_payload(invoice, company)

        logger.info(f"Submitting invoice {invoice.invoice_number} to PRAL ({_env()})")

        # POST to PRAL
        url = f"{_base_url()}/invoice"
        headers = {
            'Authorization': f'Bearer {token}',
            'Content-Type':  'application/json',
            'Accept':        'application/json',
        }
        resp = requests.post(url, json=payload, headers=headers, timeout=_TIMEOUT, verify=True)

        # PRAL returns 200 on success
        if resp.status_code == 200:
            data = resp.json()
            irn     = data.get('InvoiceRefNumber') or data.get('IRN') or data.get('irn', '')
            qr_code = data.get('QRCode') or data.get('qr_code') or data.get('QrCodeUrl', '')

            logger.info(f"PRAL accepted invoice {invoice.invoice_number} — IRN: {irn}")
            return {'success': True, 'irn': irn, 'qr_code': qr_code}

        else:
            error_text = resp.text[:500]
            logger.error(f"PRAL rejected invoice {invoice.invoice_number}: HTTP {resp.status_code} — {error_text}")
            return {
                'success': False,
                'error':   f"PRAL returned HTTP {resp.status_code}: {error_text}",
            }

    except requests.exceptions.ConnectionError:
        msg = "Cannot connect to PRAL server. Check internet connection or PRAL endpoint."
        logger.error(f"PRAL connection error for invoice {invoice.invoice_number}: {msg}")
        return {'success': False, 'error': msg}

    except requests.exceptions.Timeout:
        msg = f"PRAL request timed out after {_TIMEOUT}s."
        logger.error(f"PRAL timeout for invoice {invoice.invoice_number}")
        return {'success': False, 'error': msg}

    except Exception as e:
        msg = str(e)
        logger.exception(f"Unexpected error submitting invoice {invoice.invoice_number} to PRAL: {msg}")
        return {'success': False, 'error': msg}
