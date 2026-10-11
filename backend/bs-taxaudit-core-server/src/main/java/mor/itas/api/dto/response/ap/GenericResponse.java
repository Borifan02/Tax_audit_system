package mor.itas.api.dto.response.ap;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * GenericResponse - Generic Response DTO for API responses
 * 
 * Wraps all responses with consistent structure:
 * - data: The actual response payload
 * - count: Number of items (for lists)
 * - total: Total items available (for pagination)
 * - status: HTTP status or business status
 * - message: Optional message
 * - error: Error details if present
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public class GenericResponse<T> {
    
    private T data;
    private Integer count;
    private Long total;
    private String status;
    private String message;
    private ErrorDetail error;
    
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class ErrorDetail {
        private String code;
        private String message;
        private String details;
    }
    
    // Helper methods
    public static <T> GenericResponse<T> success(T data) {
        return new GenericResponse<>(data, null, null, "SUCCESS", null, null);
    }
    
    public static <T> GenericResponse<T> success(T data, Integer count, Long total) {
        return new GenericResponse<>(data, count, total, "SUCCESS", null, null);
    }
    
    public static <T> GenericResponse<T> error(String code, String message) {
        return new GenericResponse<>(null, null, null, "ERROR", null, new ErrorDetail(code, message, null));
    }
}
