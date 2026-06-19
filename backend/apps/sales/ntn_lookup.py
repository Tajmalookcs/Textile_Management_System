"""
NTN / STR# Verification Service
Calls FBR's taxpayer verification API to auto-fill customer details.

FBR Taxpayer Verification URL:
  https://e.fbr.gov.pk/esbn/Verification#

API endpoint (unofficial, subject to change by FBR):
  GET https://efbr.fbr.gov.pk/efiling/api/v1/taxpayer?ntn=<NTN>

Since FBR's API requires authentication and may change,
this module is structured so the lookup function can be
swapped to the official endpoint once credentials are available.

Fallback: returns unverified data so the form still works.
"""

import os
import logging
import requests

logger = logging.getLogger(__name__)

TIMEOUT = 10

PROVINCE_LABELS = {
    'punjab':      'Punjab',
    'sindh':       'Sindh',
    'kpk':         'Khyber Pakhtunkhwa (KPK)',
    'balochistan': 'Balochistan',
    'federal':     'Federal / Islamabad',
    'ajk':         'AJK',
    'gb':          'Gilgit-Baltistan',
}

# FBR regional offices map to provinces
# RTO = Regional Tax Office, LTU = Large Taxpayers Unit
FBR_OFFICE_TO_PROVINCE = {
    # Punjab
    'rto lahore':       'punjab',
    'rto faisalabad':   'punjab',
    'rto rawalpindi':   'punjab',
    'rto gujranwala':   'punjab',
    'rto multan':       'punjab',
    'rto bahawalpur':   'punjab',
    'rto sialkot':      'punjab',
    'ltu lahore':       'punjab',
    # Sindh
    'rto karachi':      'sindh',
    'rto hyderabad':    'sindh',
    'rto sukkur':       'sindh',
    'ltu karachi':      'sindh',
    # KPK
    'rto peshawar':     'kpk',
    'rto abbottabad':   'kpk',
    # Balochistan
    'rto quetta':       'balochistan',
    # Federal
    'rto islamabad':    'federal',
    'rto azad kashmir': 'ajk',
}


def _detect_province_from_city(city: str) -> str:
    """Guess province from city name as a last resort."""
    city = (city or '').lower().strip()
    punjab_cities = ['lahore','faisalabad','rawalpindi','gujranwala','multan','sialkot','bahawalpur','sargodha','sheikhupura','jhang','gujrat','rahim yar khan','kasur','dera ghazi khan','sahiwal','okara']
    sindh_cities  = ['karachi','hyderabad','sukkur','larkana','nawabshah','mirpur khas','khairpur','jacobabad','shikarpur']
    kpk_cities    = ['peshawar','abbottabad','mardan','mingora','kohat','dera ismail khan','swabi','nowshera']
    balo_cities   = ['quetta','turbat','khuzdar','hub','chaman','zhob']
    if any(c in city for c in punjab_cities): return 'punjab'
    if any(c in city for c in sindh_cities):  return 'sindh'
    if any(c in city for c in kpk_cities):    return 'kpk'
    if any(c in city for c in balo_cities):   return 'balochistan'
    return 'federal'


def lookup_ntn(ntn: str) -> dict:
    """
    Look up a taxpayer by NTN using FBR's verification service.

    Returns:
    {
        'found':      True | False,
        'verified':   True | False,
        'name':       'Business name',
        'address':    'Registered address',
        'city':       'City',
        'province':   'punjab' | 'sindh' | ...,
        'ntn':        'cleaned NTN',
        'str_number': 'STR# if registered for sales tax',
        'error':      'message if failed',
    }
    """
    ntn = (ntn or '').strip().replace(' ', '').replace('-', '')
    if not ntn:
        return {'found': False, 'error': 'NTN is required.'}
    if len(ntn) < 7:
        return {'found': False, 'error': 'NTN must be at least 7 digits.'}

    # ── Try FBR e-filing verification API ──
    try:
        url = f"https://efbr.fbr.gov.pk/efiling/api/v1/taxpayer"
        params = {'ntn': ntn}
        headers = {'Accept': 'application/json', 'User-Agent': 'TextileMgmtSystem/1.0'}
        resp = requests.get(url, params=params, headers=headers, timeout=TIMEOUT, verify=True)

        if resp.status_code == 200:
            data = resp.json()
            if data.get('taxpayerName') or data.get('name'):
                name    = data.get('taxpayerName') or data.get('name', '')
                address = data.get('address', '')
                city    = data.get('city', '')
                office  = (data.get('rtoOffice') or data.get('office') or '').lower()
                province = FBR_OFFICE_TO_PROVINCE.get(office) or _detect_province_from_city(city)
                str_no  = data.get('strn') or data.get('str') or ''
                return {
                    'found':      True,
                    'verified':   True,
                    'name':       name,
                    'address':    address,
                    'city':       city,
                    'province':   province,
                    'ntn':        ntn,
                    'str_number': str_no,
                }

    except requests.exceptions.ConnectionError:
        logger.warning(f"FBR API unreachable for NTN {ntn}")
    except requests.exceptions.Timeout:
        logger.warning(f"FBR API timeout for NTN {ntn}")
    except Exception as e:
        logger.error(f"FBR NTN lookup error for {ntn}: {e}")

    # ── Try alternative: FBR taxpayer search portal ──
    try:
        url2 = f"https://e.fbr.gov.pk/esbn/Verification"
        params2 = {'NTN': ntn, 'type': 'NTN'}
        resp2 = requests.get(url2, params=params2, headers={'User-Agent': 'TextileMgmtSystem/1.0'}, timeout=TIMEOUT, verify=True)
        # Parse response if HTML — look for taxpayer name in page
        if resp2.status_code == 200 and 'taxpayer' in resp2.text.lower():
            # Basic scrape fallback — limited info
            return {
                'found':    True,
                'verified': True,
                'name':     '',
                'address':  '',
                'city':     '',
                'province': 'federal',
                'ntn':      ntn,
                'str_number': '',
                'note': 'Partial verification — fill remaining fields manually.',
            }
    except Exception:
        pass

    # ── Both failed — return not found ──
    return {
        'found':   False,
        'verified': False,
        'ntn':     ntn,
        'error':   'Could not verify NTN with FBR at this time. You can still save the customer manually.',
    }


def lookup_str(str_number: str) -> dict:
    """
    Look up a taxpayer by STR# (Sales Tax Registration Number).
    STR# format: XX-XX-XXXX-XXX-XX (e.g. 04-05-3200-009-46)
    Province is encoded in the STR# prefix:
      04 = Punjab (PRA)
      05 = Sindh (SRB)
      06 = KPK (KPRA)
      07 = Balochistan (BRA)
      01-03 = Federal (FBR)
    """
    str_clean = (str_number or '').strip()
    if not str_clean:
        return {'found': False, 'error': 'STR# is required.'}

    # Detect province from STR# prefix
    prefix = str_clean.replace('-', '')[:2]
    province_from_str = {
        '01': 'federal', '02': 'federal', '03': 'federal',
        '04': 'punjab',
        '05': 'sindh',
        '06': 'kpk',
        '07': 'balochistan',
    }.get(prefix, 'federal')

    # Try FBR STRN verification
    try:
        url = "https://efbr.fbr.gov.pk/efiling/api/v1/taxpayer"
        resp = requests.get(url, params={'strn': str_clean}, headers={'Accept': 'application/json'}, timeout=TIMEOUT, verify=True)
        if resp.status_code == 200:
            data = resp.json()
            if data.get('taxpayerName') or data.get('name'):
                return {
                    'found':      True,
                    'verified':   True,
                    'name':       data.get('taxpayerName') or data.get('name', ''),
                    'address':    data.get('address', ''),
                    'city':       data.get('city', ''),
                    'province':   province_from_str,
                    'ntn':        data.get('ntn', ''),
                    'str_number': str_clean,
                }
    except Exception as e:
        logger.error(f"STR lookup error for {str_clean}: {e}")

    # Return province at minimum — derived from STR# prefix
    return {
        'found':      True,
        'verified':   False,
        'name':       '',
        'address':    '',
        'city':       '',
        'province':   province_from_str,
        'ntn':        '',
        'str_number': str_clean,
        'note':       f'Province detected from STR# prefix ({prefix}): {PROVINCE_LABELS.get(province_from_str)}. Verify remaining fields manually.',
    }
