package mor.itas.domain.valueobject.ca;

/**
 * Tax type classification for CA findings and assessment notices.
 * FR-04.4-29 — notice broken down per tax type.
 */
public enum CaTaxType {
    CIT,      // Corporate Income Tax
    VAT,      // Value Added Tax
    PAYE,     // Pay As You Earn (employment income tax)
    WHT,      // Withholding Tax
    CUSTOMS   // Customs duties (ASYCUDA-sourced)
}
