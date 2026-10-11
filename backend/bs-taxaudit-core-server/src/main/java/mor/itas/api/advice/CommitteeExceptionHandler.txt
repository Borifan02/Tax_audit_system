package mor.itas.api.advice;

import mor.itas.api.dto.response.ap.jac.ErrorResponse;
import mor.itas.api.dto.response.ap.jac.ValidationErrorResponse;
import mor.itas.domain.exception.*;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.context.request.WebRequest;
import lombok.extern.slf4j.Slf4j;

import jakarta.servlet.http.HttpServletRequest;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Global Exception Handler for Committee (JAC) Controllers
 * Handles domain exceptions and converts them to appropriate HTTP responses
 */
@RestControllerAdvice
@Slf4j
public class CommitteeExceptionHandler {

    /**
     * Handle DuplicateVoteException
     * Returns 409 CONFLICT when member attempts to vote twice on same case
     */
    @ExceptionHandler(DuplicateVoteException.class)
    public ResponseEntity<ErrorResponse> handleDuplicateVote(
            DuplicateVoteException ex,
            HttpServletRequest request) {
        log.warn("Duplicate vote attempted: {}", ex.getMessage());
        ErrorResponse error = new ErrorResponse(
                "DUPLICATE_VOTE",
                "Member has already voted on this case. Only one vote per member allowed.",
                System.currentTimeMillis(),
                request.getRequestURI());
        return ResponseEntity.status(HttpStatus.CONFLICT).body(error);
    }

    /**
     * Handle InvalidVotingStateException
     * Returns 422 UNPROCESSABLE_ENTITY when voting is not open
     */
    @ExceptionHandler(InvalidVotingStateException.class)
    public ResponseEntity<ErrorResponse> handleInvalidVotingState(
            InvalidVotingStateException ex,
            HttpServletRequest request) {
        log.warn("Invalid voting state: {}", ex.getMessage());
        ErrorResponse error = new ErrorResponse(
                "INVALID_VOTING_STATE",
                "Voting is not currently open for this case. " + ex.getMessage(),
                System.currentTimeMillis(),
                request.getRequestURI());
        return ResponseEntity.status(HttpStatus.UNPROCESSABLE_ENTITY).body(error);
    }

    /**
     * Handle InvalidTeamSizeException
     * Returns 422 UNPROCESSABLE_ENTITY when team size violates constraints
     */
    @ExceptionHandler(InvalidTeamSizeException.class)
    public ResponseEntity<ErrorResponse> handleInvalidTeamSize(
            InvalidTeamSizeException ex,
            HttpServletRequest request) {
        log.warn("Invalid team size: {}", ex.getMessage());
        ErrorResponse error = new ErrorResponse(
                "INVALID_TEAM_SIZE",
                "Team must have 2-5 members. " + ex.getMessage(),
                System.currentTimeMillis(),
                request.getRequestURI());
        return ResponseEntity.status(HttpStatus.UNPROCESSABLE_ENTITY).body(error);
    }

    /**
     * Handle InvalidCaseStateException
     * Returns 422 UNPROCESSABLE_ENTITY when case is in wrong state for operation
     */
    @ExceptionHandler(InvalidCaseStateException.class)
    public ResponseEntity<ErrorResponse> handleInvalidCaseState(
            InvalidCaseStateException ex,
            HttpServletRequest request) {
        log.warn("Invalid case state: {}", ex.getMessage());
        ErrorResponse error = new ErrorResponse(
                "INVALID_CASE_STATE",
                "Case is not in the correct state for this operation. " + ex.getMessage(),
                System.currentTimeMillis(),
                request.getRequestURI());
        return ResponseEntity.status(HttpStatus.UNPROCESSABLE_ENTITY).body(error);
    }

    /**
     * Handle SLAExtensionLimitExceededException
     * Returns 422 UNPROCESSABLE_ENTITY when max extensions (2) exceeded
     */
    @ExceptionHandler(SLAExtensionLimitExceededException.class)
    public ResponseEntity<ErrorResponse> handleSLALimitExceeded(
            SLAExtensionLimitExceededException ex,
            HttpServletRequest request) {
        log.warn("SLA extension limit exceeded: {}", ex.getMessage());
        ErrorResponse error = new ErrorResponse(
                "SLA_EXTENSION_LIMIT_EXCEEDED",
                "Maximum number of SLA extensions (2) has been reached for this case.",
                System.currentTimeMillis(),
                request.getRequestURI());
        return ResponseEntity.status(HttpStatus.UNPROCESSABLE_ENTITY).body(error);
    }

    /**
     * Handle CaseAlreadyOwnedException
     * Returns 409 CONFLICT when case is already checked out by another member
     */
    @ExceptionHandler(CaseAlreadyOwnedException.class)
    public ResponseEntity<ErrorResponse> handleCaseAlreadyOwned(
            CaseAlreadyOwnedException ex,
            HttpServletRequest request) {
        log.warn("Case already owned: {}", ex.getMessage());
        ErrorResponse error = new ErrorResponse(
                "CASE_ALREADY_OWNED",
                "Case is currently locked by another committee member. " + ex.getMessage(),
                System.currentTimeMillis(),
                request.getRequestURI());
        return ResponseEntity.status(HttpStatus.CONFLICT).body(error);
    }

    /**
     * Handle UnauthorizedAccessException
     * Returns 403 FORBIDDEN when user lacks required role
     */
    @ExceptionHandler(UnauthorizedAccessException.class)
    public ResponseEntity<ErrorResponse> handleUnauthorizedAccess(
            UnauthorizedAccessException ex,
            HttpServletRequest request) {
        log.warn("Unauthorized access attempted: {}", ex.getMessage());
        ErrorResponse error = new ErrorResponse(
                "UNAUTHORIZED_ACCESS",
                "You do not have permission to perform this action. " + ex.getMessage(),
                System.currentTimeMillis(),
                request.getRequestURI());
        return ResponseEntity.status(HttpStatus.FORBIDDEN).body(error);
    }

    /**
     * Handle IllegalStateException (e.g. business rule violations)
     * Returns 409 CONFLICT for state-based errors
     */
    @ExceptionHandler(IllegalStateException.class)
    public ResponseEntity<ErrorResponse> handleIllegalState(
            IllegalStateException ex,
            HttpServletRequest request) {
        log.warn("Illegal state: {}", ex.getMessage());
        ErrorResponse error = new ErrorResponse(
                "INVALID_STATE",
                ex.getMessage(),
                System.currentTimeMillis(),
                request.getRequestURI());
        return ResponseEntity.status(HttpStatus.CONFLICT).body(error);
    }

    /**
     * Handle IllegalArgumentException (e.g. not found)
     * Returns 404 NOT_FOUND
     */
    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<ErrorResponse> handleIllegalArgument(
            IllegalArgumentException ex,
            HttpServletRequest request) {
        log.warn("Invalid argument: {}", ex.getMessage());
        ErrorResponse error = new ErrorResponse(
                "NOT_FOUND",
                ex.getMessage(),
                System.currentTimeMillis(),
                request.getRequestURI());
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(error);
    }

    /**
     * Handle MethodArgumentNotValidException
     * Returns 400 BAD_REQUEST with field-level validation errors
     */
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ValidationErrorResponse> handleValidationErrors(
            MethodArgumentNotValidException ex,
            HttpServletRequest request) {
        log.warn("Request validation failed");
        
        Map<String, List<String>> fieldErrors = new HashMap<>();
        ex.getBindingResult().getFieldErrors().forEach(error ->
            fieldErrors.computeIfAbsent(error.getField(), k -> new ArrayList<>())
                .add(error.getDefaultMessage())
        );

        ValidationErrorResponse error = new ValidationErrorResponse();
        error.setErrorCode("VALIDATION_ERROR");
        error.setMessage("Request validation failed. Please check field errors.");
        error.setFieldErrors(fieldErrors);
        error.setTimestamp(System.currentTimeMillis());
        error.setPath(request.getRequestURI());

        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
    }

    /**
     * Handle generic CommitteeCaseException
     * Returns 400 BAD_REQUEST for general domain exceptions
     */
    @ExceptionHandler(CommitteeCaseException.class)
    public ResponseEntity<ErrorResponse> handleCommitteeCaseException(
            CommitteeCaseException ex,
            HttpServletRequest request) {
        log.error("Committee case exception: {}", ex.getMessage());
        ErrorResponse error = new ErrorResponse(
                "COMMITTEE_CASE_ERROR",
                ex.getMessage(),
                System.currentTimeMillis(),
                request.getRequestURI());
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
    }

    /**
     * Handle generic Exception (catch-all)
     * Returns 500 INTERNAL_SERVER_ERROR for unexpected errors
     */
    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponse> handleGenericException(
            Exception ex,
            HttpServletRequest request) {
        log.error("Unexpected exception occurred", ex);
        ErrorResponse error = new ErrorResponse(
                "INTERNAL_SERVER_ERROR",
                "An unexpected error occurred. Please contact support.",
                System.currentTimeMillis(),
                request.getRequestURI());
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
    }
}
