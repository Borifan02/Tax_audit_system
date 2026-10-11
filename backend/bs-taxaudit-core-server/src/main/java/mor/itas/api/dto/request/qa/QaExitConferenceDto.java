package mor.itas.api.dto.request.qa;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class QaExitConferenceDto {
    private String id;
    private String scheduledDate;
    private String status;
    private String minutes;
    private String auditorComments;
    private Boolean resolvedFlag;
}
