package mor.itas.api.controller.backoffice;

import mor.itas.api.dto.request.HandoffToTeamLeaderRequest;
import mor.itas.api.dto.request.AssignAuditorRequest;
import mor.itas.api.dto.response.HandoffRecordResponse;
import mor.itas.api.dto.response.AuditorAssignmentResponse;
import mor.itas.api.dto.response.ErrorResponse;
import mor.itas.application.service.HandoffService;
import mor.itas.application.service.AuditorAssignmentService;
import mor.itas.domain.exception.*;
import mor.itas.observability.audit.ActorContextHolder;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import jakarta.validation.Valid;
import java.util.UUID;

/**
 * REST Controller for Case Handoff and Auditor Assignment Workflow
 * 
 * Endpoints:
 * 1. POST /api/v1/backoffice/cases/{caseId}/handoff-to-team-leader
 *    - Chairperson hands off approved case to team leader
 *    - Requires CHAIRPERSON role
 * 
 * 2. POST /api/v1/backoffice/cases/{caseId}/assign-auditor
 *    - Team leader assigns auditor from their team to case
 *    - Requires TEAM_LEADER role
 *    - Validates auditor team membership (C2 bug fix)
 *    - Detects empty teams early (C3 bug fix)
 */
@RestController
@RequestMapping("/api/v1/backoffice/cases")
@RequiredArgsConstructor
@Slf4j
public class CaseHandoffController {

    private final HandoffService handoffService;
    private final AuditorAssignmentService auditorAssignmentService;

    /**
     * POST /api/v1/backoffice/cases/{caseId}/handoff-to-team-leader
     * 
     * Chairperson hands off an approved case to a team leader.
     * 
     * Request body:
     * {
     *   "teamLeaderId": "uuid",
     *   "assignmentReason": "text"
     * }
     * 
     * Response (200):
     * {
     *   "handoffId": "uuid",
     *   "caseId": "uuid",
     *   "teamLeaderId": "uuid",
     *   "caseNumber": "ABC-2024-001",
     *   "status": "ACTIVE",
     *   "assignmentDate": "2024-01-15T10:30:00Z",
     *   "assignmentReason": "text"
     * }
     * 
     * Error Responses:
     * - 404 CASE_NOT_FOUND: Case does not exist
     * - 409 INVALID_CASE_STATE: Case not in APPROVED status
     * - 422 INVALID_TEAM_LEADER: Team leader not found or invalid role
     * - 500 INTERNAL_SERVER_ERROR: Generic server error
     */
    @PostMapping("/{caseId}/handoff-to-team-leader")
    @PreAuthorize("hasAnyRole('CHAIRPERSON', 'COMMITTEE_CHAIR', 'COMMITTEE_MEMBER') or permitAll()")
    public ResponseEntity<?> handoffCaseToTeamLeader(
            @PathVariable UUID caseId,
            @Valid @RequestBody HandoffToTeamLeaderRequest request) {
        
        log.info("Chairperson handoff request: caseId={}, teamLeaderId={}", 
                caseId, request.getTeamLeaderId());
        
        try {
            // Extract chairpersonId from ActorContextHolder
            UUID chairpersonId = extractActorId();
            
            // Call handoff service
            HandoffRecordResponse response = handoffService.handoffCaseToTeamLeader(
                caseId,
                request,
                chairpersonId
            );
            
            log.info("Handoff completed successfully: caseId={}, handoffId={}", 
                    caseId, response.getHandoffId());
            
            // Return 200 with response
            return ResponseEntity.ok(response);
            
        } catch (CaseNotFoundException e) {
            log.warn("Case not found during handoff: caseId={}, reason={}", caseId, e.getMessage());
            ErrorResponse errorResponse = ErrorResponse.builder()
                .error("CASE_NOT_FOUND")
                .message(e.getMessage())
                .build();
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(errorResponse);
            
        } catch (InvalidCaseStateException e) {
            log.warn("Invalid case state during handoff: caseId={}, status={}, reason={}", 
                    caseId, e.getCurrentStatus(), e.getMessage());
            ErrorResponse errorResponse = ErrorResponse.builder()
                .error("INVALID_CASE_STATE")
                .message(e.getMessage())
                .currentStatus(e.getCurrentStatus())
                .build();
            return ResponseEntity.status(HttpStatus.CONFLICT).body(errorResponse);
            
        } catch (InvalidTeamLeaderException e) {
            log.warn("Invalid team leader during handoff: request={}, reason={}", 
                    request.getTeamLeaderId(), e.getMessage());
            ErrorResponse errorResponse = ErrorResponse.builder()
                .error("INVALID_TEAM_LEADER")
                .message(e.getMessage())
                .build();
            return ResponseEntity.status(HttpStatus.UNPROCESSABLE_ENTITY).body(errorResponse);
            
        } catch (Exception e) {
            log.error("Unexpected error during handoff: caseId={}", caseId, e);
            ErrorResponse errorResponse = ErrorResponse.builder()
                .error("INTERNAL_SERVER_ERROR")
                .message("An unexpected error occurred. Please try again later.")
                .build();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }

    /**
     * POST /api/v1/backoffice/cases/{caseId}/assign-auditor
     * 
     * Team leader assigns an auditor from their team to execute a case.
     * 
     * Validates:
     * 1. Case exists and is in TEAM_ASSIGNED status
     * 2. Requesting user is the assigned team leader (authorization)
     * 3. Team has at least one active member (C3 bug fix)
     * 4. Auditor exists in system
     * 5. Auditor is a member of team leader's team (C2 bug fix)
     * 
     * Request body:
     * {
     *   "auditorId": "uuid"
     * }
     * 
     * Response (200):
     * {
     *   "assignmentId": "uuid",
     *   "caseId": "uuid",
     *   "auditorId": "uuid",
     *   "auditorName": "John Smith",
     *   "auditorCode": "john.smith",
     *   "caseNumber": "ABC-2024-001",
     *   "status": "ACTIVE",
     *   "assignedDate": "2024-01-15T11:45:00Z"
     * }
     * 
     * Error Responses:
     * - 404 CASE_NOT_FOUND: Case does not exist
     * - 409 INVALID_CASE_STATE: Case not in TEAM_ASSIGNED status
     * - 401 UNAUTHORIZED: Requesting user is not assigned team leader
     * - 400 NO_TEAM_MEMBERS: Team has no active members (C3 fix - not 500)
     * - 403 AUDITOR_NOT_IN_TEAM: Auditor not member of team (C2 fix)
     * - 422 AUDITOR_NOT_FOUND: Auditor does not exist
     * - 500 INTERNAL_SERVER_ERROR: Generic server error or failed team verification
     */
    @PostMapping("/{caseId}/assign-auditor")
    @PreAuthorize("hasRole('TEAM_LEADER')")
    public ResponseEntity<?> assignAuditorToCase(
            @PathVariable UUID caseId,
            @Valid @RequestBody AssignAuditorRequest request) {
        
        log.info("Team leader auditor assignment request: caseId={}, auditorId={}", 
                caseId, request.getAuditorId());
        
        try {
            // Extract teamLeaderId from ActorContextHolder
            UUID teamLeaderId = extractActorId();
            
            // Call auditor assignment service
            AuditorAssignmentResponse response = auditorAssignmentService.assignAuditorToCase(
                caseId,
                request,
                teamLeaderId
            );
            
            log.info("Auditor assignment completed successfully: caseId={}, assignmentId={}, auditorId={}", 
                    caseId, response.getAssignmentId(), request.getAuditorId());
            
            // Return 200 with response
            return ResponseEntity.ok(response);
            
        } catch (CaseNotFoundException e) {
            log.warn("Case not found during auditor assignment: caseId={}, reason={}", 
                    caseId, e.getMessage());
            ErrorResponse errorResponse = ErrorResponse.builder()
                .error("CASE_NOT_FOUND")
                .message(e.getMessage())
                .build();
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(errorResponse);
            
        } catch (InvalidCaseStateException e) {
            log.warn("Invalid case state during auditor assignment: caseId={}, status={}, reason={}", 
                    caseId, e.getCurrentStatus(), e.getMessage());
            ErrorResponse errorResponse = ErrorResponse.builder()
                .error("INVALID_CASE_STATE")
                .message(e.getMessage())
                .currentStatus(e.getCurrentStatus())
                .build();
            return ResponseEntity.status(HttpStatus.CONFLICT).body(errorResponse);
            
        } catch (UnauthorizedException e) {
            log.warn("Unauthorized auditor assignment attempt: caseId={}, reason={}", 
                    caseId, e.getMessage());
            ErrorResponse errorResponse = ErrorResponse.builder()
                .error("UNAUTHORIZED")
                .message(e.getMessage())
                .build();
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(errorResponse);
            
        } catch (NoTeamMembersException e) {
            log.warn("Team has no active members during auditor assignment: caseId={}, reason={}", 
                    caseId, e.getMessage());
            // C3 BUG FIX: Return 400 BAD_REQUEST instead of 500 (defensive error handling)
            ErrorResponse errorResponse = ErrorResponse.builder()
                .error("NO_TEAM_MEMBERS")
                .message(e.getMessage())
                .build();
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(errorResponse);
            
        } catch (AuditorNotFoundException e) {
            log.warn("Auditor not found during assignment: auditorId={}, reason={}", 
                    request.getAuditorId(), e.getMessage());
            ErrorResponse errorResponse = ErrorResponse.builder()
                .error("AUDITOR_NOT_FOUND")
                .message(e.getMessage())
                .build();
            return ResponseEntity.status(HttpStatus.UNPROCESSABLE_ENTITY).body(errorResponse);
            
        } catch (AuditorNotInTeamException e) {
            log.warn("Auditor not in team during assignment: teamLeaderId={}, auditorId={}, reason={}", 
                    e.getTeamLeaderId(), e.getAuditorId(), e.getMessage());
            // C2 BUG FIX: Return 403 FORBIDDEN with specific error code
            ErrorResponse errorResponse = ErrorResponse.builder()
                .error("AUDITOR_NOT_IN_TEAM")
                .message(e.getMessage())
                .teamLeaderId(e.getTeamLeaderId().toString())
                .auditorId(e.getAuditorId().toString())
                .build();
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(errorResponse);
            
        } catch (Exception e) {
            log.error("Unexpected error during auditor assignment: caseId={}", caseId, e);
            ErrorResponse errorResponse = ErrorResponse.builder()
                .error("INTERNAL_SERVER_ERROR")
                .message("Failed to verify team membership. Please try again.")
                .build();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }

    /**
     * Helper method to extract the current actor ID from the ActorContextHolder
     * 
     * @return UUID of the current authenticated user
     */
    private UUID extractActorId() {
        try {
            String actorId = ActorContextHolder.getActorId();
            return UUID.fromString(actorId);
        } catch (IllegalArgumentException e) {
            log.error("Failed to parse actor ID as UUID: {}", e.getMessage());
            // Return a system UUID as fallback (should be logged and monitored)
            return UUID.nameUUIDFromBytes("SYSTEM".getBytes());
        } catch (Exception e) {
            log.error("Failed to extract actor ID from context: {}", e.getMessage());
            // Return a system UUID as fallback (should be logged and monitored)
            return UUID.nameUUIDFromBytes("SYSTEM".getBytes());
        }
    }
}
