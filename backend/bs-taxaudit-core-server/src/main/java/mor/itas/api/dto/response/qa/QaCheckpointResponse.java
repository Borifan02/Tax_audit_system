package mor.itas.api.dto.response.qa;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Map;

/**
 * One verifiable checkpoint inside a QA review dimension.
 *
 * Mirrors the frontend {@code QACheckpoint} contract exactly so the workspace
 * can bind without an adapter.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class QaCheckpointResponse {

    private String id;
    private String text;
    private Boolean isSatisfied;
    private Boolean isCritical;
    private String auditorEvidenceRef;
    private String notes;

    /** Tolerant mapping from the jsonb row shape (id/text/isSatisfied/isCritical/...). */
    public static QaCheckpointResponse fromMap(Map<String, Object> row) {
        if (row == null) return null;
        return QaCheckpointResponse.builder()
                .id(asString(row.get("id")))
                .text(asString(row.get("text")))
                .isSatisfied(asBoolean(row.get("isSatisfied")))
                .isCritical(asBoolean(row.get("isCritical")))
                .auditorEvidenceRef(asString(firstNonNull(row, "auditorEvidenceRef", "auditor_evidence_ref")))
                .notes(asString(row.get("notes")))
                .build();
    }

    private static Object firstNonNull(Map<String, Object> row, String... keys) {
        for (String k : keys) {
            if (row.get(k) != null) return row.get(k);
        }
        return null;
    }

    private static String asString(Object v) {
        return v == null ? null : String.valueOf(v);
    }

    private static Boolean asBoolean(Object v) {
        if (v == null) return Boolean.FALSE;
        if (v instanceof Boolean b) return b;
        return Boolean.parseBoolean(String.valueOf(v));
    }
}
