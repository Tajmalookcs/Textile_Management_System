from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView, TokenVerifyView

from apps.core.views import CompanySettingsViewSet
from apps.users.views import UserViewSet
from apps.products.views import PCTCodeViewSet, CategoryViewSet, UnitViewSet, ProductViewSet
from apps.inventory.views import WarehouseViewSet, StockTransactionViewSet, StockViewSet
from apps.purchases.views import SupplierViewSet, PurchaseOrderViewSet, PurchaseOrderItemViewSet
from apps.production.views import ProcessingBatchViewSet, BatchInputViewSet, BatchOutputViewSet
from apps.sales.views import CustomerViewSet, InvoiceViewSet, InvoiceItemViewSet, ntn_lookup_view, str_lookup_view
from apps.accounts.views import LedgerEntryViewSet, AccountViewSet

router = DefaultRouter()

router.register(r'company',               CompanySettingsViewSet, basename='company')
router.register(r'users',                 UserViewSet,            basename='user')
router.register(r'pct-codes',             PCTCodeViewSet,         basename='pct-code')
router.register(r'categories',            CategoryViewSet,        basename='category')
router.register(r'units',                 UnitViewSet,            basename='unit')
router.register(r'products',              ProductViewSet,         basename='product')
router.register(r'warehouses',            WarehouseViewSet,       basename='warehouse')
router.register(r'stock-transactions',    StockTransactionViewSet,basename='stock-transaction')
router.register(r'stock',                 StockViewSet,           basename='stock')
router.register(r'suppliers',             SupplierViewSet,        basename='supplier')
router.register(r'purchase-orders',       PurchaseOrderViewSet,   basename='purchase-order')
router.register(r'purchase-order-items',  PurchaseOrderItemViewSet,basename='purchase-order-item')
router.register(r'batches',              ProcessingBatchViewSet,  basename='batch')
router.register(r'batch-inputs',         BatchInputViewSet,       basename='batch-input')
router.register(r'batch-outputs',        BatchOutputViewSet,      basename='batch-output')
router.register(r'customers',            CustomerViewSet,         basename='customer')
router.register(r'invoices',             InvoiceViewSet,          basename='invoice')
router.register(r'invoice-items',        InvoiceItemViewSet,      basename='invoice-item')
router.register(r'accounts',             AccountViewSet,          basename='account')
router.register(r'ledger',               LedgerEntryViewSet,      basename='ledger')

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/auth/token/',         TokenObtainPairView.as_view(),  name='token_obtain_pair'),
    path('api/auth/token/refresh/', TokenRefreshView.as_view(),     name='token_refresh'),
    path('api/auth/token/verify/',  TokenVerifyView.as_view(),      name='token_verify'),
    path('api/verify/ntn/',         ntn_lookup_view,                name='ntn-lookup'),
    path('api/verify/str/',         str_lookup_view,                name='str-lookup'),
    path('api/', include(router.urls)),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
