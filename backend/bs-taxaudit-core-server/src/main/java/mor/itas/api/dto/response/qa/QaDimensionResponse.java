package mor.itas.api.dto.response.qa;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * One of the (up to 8) ISO-19011 review dimensions the QA officer scores.
 *
 * Mirrors the frontend {@code QADimensionScore} contract. {@code weight} is a
 * percentage of the overall score and {@code score} is 0-100.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class QaDimensionResponse {

    private String id;
    private String category;
    private String title;
    private String standardsReference;
    private Integer weight;
    private Integer score;
    private String status;
    private String reviewerNotes;
    private List<QaCheckpointResponse> checkpoints;
}
