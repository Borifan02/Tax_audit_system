package mor.itas.api.dto.response.qa;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Map;

/** One agenda line drafted for the exit conference (FR-04.9.2-07 / -08). */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class QaAgendaItemResponse {

    private String id;
    private String title;
    private String description;
    private String presenter;
    /** WHO | WHAT | WHEN | HOW — kept free-form so the UI can evolve. */
    private String category;
    private Integer durationMinutes;
    private String supportingReference;

    public static QaAgendaItemResponse fromMap(Map<String, Object> row) {
        if (row == null) return null;
        return QaAgendaItemResponse.builder()
                .id(str(row.get("id")))
                .title(str(row.get("title")))
                .description(str(row.get("description")))
                .presenter(str(row.get("presenter")))
                .category(str(row.get("category")))
                .durationMinutes(intVal(row.get("durationMinutes") != null ? row.get("durationMinutes") : row.get("duration_minutes")))
                .supportingReference(str(row.get("supportingReference") != null ? row.get("supportingReference") : row.get("supporting_reference")))
                .build();
    }

    private static String str(Object v) { return v == null ? null : String.valueOf(v); }

    private static Integer intVal(Object v) {
        if (v == null) return null;
        if (v instanceof Number n) return n.intValue();
        try { return Integer.valueOf(String.valueOf(v)); } catch (NumberFormatException e) { return null; }
    }
}
