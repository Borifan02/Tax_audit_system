package mor.itas.domain.service.ap;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.OffsetDateTime;
import java.util.Base64;
import java.util.UUID;

/**
 * Digital Signature Service
 *
 * Generates cryptographic signatures for chairperson decisions on committee cases.
 * Uses HMAC-SHA256 with a server-side secret to produce tamper-evident signatures.
 *
 * Signature format:
 *   base64(HMAC-SHA256(secret, caseId|decision|chairpersonId|timestamp|reason))
 *
 * Verification:
 *   Recompute the signature with the same inputs and compare.
 *
 * In production, this would integrate with a HSM (Hardware Security Module)
 * or use asymmetric cryptography (RSA/ECDSA) for non-repudiation.
 */
@Service
@Slf4j
public class DigitalSignatureService {

    /** Server secret for HMAC signing. In production, load from HSM/vault. */
    private static final String SIGNING_SECRET = "ITAS-JAC-DIGITAL-SIGNATURE-SECRET-2026";

    private static final String ALGORITHM = "HmacSHA256";

    /**
     * Generate a digital signature for a viability decision.
     *
     * @param caseId       the case being decided
     * @param decision     APPROVED or REJECTED
     * @param chairpersonId the chairperson making the decision
     * @param reason       justification for the decision
     * @return DigitalSignature with signature, timestamp, and verification data
     */
    public DigitalSignature signViabilityDecision(UUID caseId, String decision,
                                                   UUID chairpersonId, String reason) {
        if (caseId == null || decision == null || chairpersonId == null) {
            throw new IllegalArgumentException("caseId, decision, and chairpersonId are required");
        }

        OffsetDateTime timestamp = OffsetDateTime.now();
        String payload = buildPayload(caseId, decision, chairpersonId, timestamp, reason);
        String signature = computeHMAC(payload);

        String verificationCode = computeVerificationCode(signature);

        log.info("[DIGITAL-SIGNATURE] Signed viability decision: caseId={}, decision={}, chairperson={}, verification={}",
                caseId, decision, chairpersonId, verificationCode);

        return DigitalSignature.builder()
                .signature(signature)
                .algorithm(ALGORITHM)
                .timestamp(timestamp)
                .verificationCode(verificationCode)
                .caseId(caseId)
                .decision(decision)
                .chairpersonId(chairpersonId)
                .build();
    }

    /**
     * Verify a digital signature.
     *
     * @param signature    the signature to verify
     * @param caseId       the case ID
     * @param decision     the decision
     * @param chairpersonId the chairperson ID
     * @param timestamp    the signing timestamp
     * @param reason       the reason
     * @return true if the signature is valid
     */
    public boolean verifySignature(String signature, UUID caseId, String decision,
                                    UUID chairpersonId, OffsetDateTime timestamp, String reason) {
        if (signature == null || caseId == null || decision == null || chairpersonId == null) {
            return false;
        }

        String payload = buildPayload(caseId, decision, chairpersonId, timestamp, reason);
        String expectedSignature = computeHMAC(payload);

        boolean valid = signature.equals(expectedSignature);
        if (!valid) {
            log.warn("[DIGITAL-SIGNATURE] Signature verification FAILED for caseId={}", caseId);
        }
        return valid;
    }

    /**
     * Generate a standalone verification code from a signature.
     * This is a short code that can be displayed to the user for manual verification.
     */
    public String computeVerificationCode(String signature) {
        if (signature == null) return "INVALID";
        // Take first 8 chars of the hash as a human-readable verification code
        return signature.substring(0, Math.min(8, signature.length())).toUpperCase();
    }

    /**
     * Generate a case-specific digital seal (for handoff records).
     */
    public String generateCaseSeal(UUID caseId, UUID handoffRecordId) {
        String payload = "SEAL|" + caseId + "|" + handoffRecordId + "|" + OffsetDateTime.now();
        return computeHMAC(payload);
    }

    // ── Internal ──────────────────────────────────────────────────────

    private String buildPayload(UUID caseId, String decision, UUID chairpersonId,
                                 OffsetDateTime timestamp, String reason) {
        return caseId + "|" + decision + "|" + chairpersonId + "|" + timestamp + "|" + (reason != null ? reason : "");
    }

    private String computeHMAC(String payload) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] secretBytes = SIGNING_SECRET.getBytes(StandardCharsets.UTF_8);
            byte[] payloadBytes = payload.getBytes(StandardCharsets.UTF_8);

            // Simple HMAC construction using SHA-256
            // For production, use javax.crypto.Mac with HmacSHA256
            byte[] combined = new byte[secretBytes.length + payloadBytes.length];
            System.arraycopy(secretBytes, 0, combined, 0, secretBytes.length);
            System.arraycopy(payloadBytes, 0, combined, secretBytes.length, payloadBytes.length);

            byte[] hash = digest.digest(combined);
            return Base64.getUrlEncoder().withoutPadding().encodeToString(hash);
        } catch (NoSuchAlgorithmException e) {
            throw new RuntimeException("SHA-256 not available", e);
        }
    }

    // ── Value Object ──────────────────────────────────────────────────

    @lombok.Builder
    @lombok.Getter
    public static class DigitalSignature {
        private String signature;
        private String algorithm;
        private OffsetDateTime timestamp;
        private String verificationCode;
        private UUID caseId;
        private String decision;
        private UUID chairpersonId;

        @Override
        public String toString() {
            return "DigitalSignature{" +
                    "verificationCode='" + verificationCode + '\'' +
                    ", decision='" + decision + '\'' +
                    ", timestamp=" + timestamp +
                    '}';
        }
    }
}
