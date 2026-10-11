package mor.itas.domain.valueobject.ca;

/**
 * Scientific sampling methods supported in CA. FR-04.4-13, 15, 16.
 * Aligns with SoR FR-04.2-06.
 */
public enum CaSamplingMethod {
    STRATIFIED,
    RANDOM,
    /** Systematic Monetary Unit Sampling */
    SYSTEMATIC_MUS
}
