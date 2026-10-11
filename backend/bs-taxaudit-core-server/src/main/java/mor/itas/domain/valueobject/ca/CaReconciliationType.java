package mor.itas.domain.valueobject.ca;

/**
 * Supported reconciliation types in the Comprehensive Audit module.
 * FR-04.4-16.
 */
public enum CaReconciliationType {
    /** VAT monthly returns vs CIT gross turnover vs TIMS e-invoices */
    VAT_VS_SALES,
    /** Payroll PAYE remitted vs P&L salaries expense */
    PAYROLL_PAYE_VS_PNL,
    /** ASYCUDA CIF imports vs General Ledger purchase costs */
    CUSTOMS_VS_PURCHASES,
    /** Declared revenue vs TIMS electronic invoice totals */
    REVENUE_VS_INVOICES
}
