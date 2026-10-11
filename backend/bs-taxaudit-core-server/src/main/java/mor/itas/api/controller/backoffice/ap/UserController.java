package mor.itas.api.controller.backoffice.ap;

import mor.itas.api.dto.request.ap.CreateUserRequest;
import mor.itas.api.dto.response.ap.UserResponse;
import mor.itas.application.usecase.ap.UserManagementUseCase;
import mor.itas.domain.model.ap.User;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;
import java.util.stream.Collectors;

/**
 * Backoffice REST Controller for User Management (AP Cluster)
 */
@RestController
@RequestMapping("/api/v1/backoffice/ap/users")
@RequiredArgsConstructor
public class UserController {

    private final UserManagementUseCase userManagementUseCase;

    @PostMapping
    public ResponseEntity<UserResponse> createUser(
            @RequestBody CreateUserRequest request,
            @RequestHeader("X-Actor-Id") String actorId) {
        try {
            User user = userManagementUseCase.createUser(
                request.getUsername(),
                request.getEmail(),
                request.getFullName(),
                request.getUserType(),
                request.getAuditType(),
                request.getAssignedLevel(),
                request.getAssignedLocation(),
                actorId
            );
            return ResponseEntity.status(HttpStatus.CREATED).body(mapUserToResponse(user));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
        }
    }

    @GetMapping
    public ResponseEntity<List<UserResponse>> getAllUsers(
            @RequestParam(required = false) String role,
            @RequestParam(required = false) String taxCenter,
            @RequestParam(required = false) String auditType,
            @RequestParam(required = false) String teamLeader,
            @RequestHeader(value = "X-Actor-Id", required = false) String actorId) {

        List<User> users;

        if ("team_leader".equalsIgnoreCase(role) || "TEAM_LEADER".equals(role)) {
            // Tax center team leaders — all audit types unless specified
            String at = auditType != null ? auditType : "";
            String tc = taxCenter != null ? taxCenter : "";
            users = userManagementUseCase.getTeamLeaders(at, tc);
            // If no auditType filter, getTeamLeaders may be filtering — fall back to all
            if (users.isEmpty() && !tc.isEmpty()) {
                users = userManagementUseCase.getAllUsers().stream()
                    .filter(u -> "TEAM_LEADER".equalsIgnoreCase(u.getUserType())
                              && (tc.isEmpty() || tc.equalsIgnoreCase(u.getAssignedLocation())))
                    .collect(java.util.stream.Collectors.toList());
            }
        } else if ("auditor".equalsIgnoreCase(role) || "AUDITOR".equals(role)) {
            if (teamLeader != null && !teamLeader.isBlank()) {
                // Filter auditors to match the Team Leader's location and audit type scope
                Optional<User> tlOpt = userManagementUseCase.getAllUsers().stream()
                    .filter(u -> u.getUserId().toString().equalsIgnoreCase(teamLeader)
                              || u.getUsername().equalsIgnoreCase(teamLeader)
                              || (u.getEmail() != null && u.getEmail().equalsIgnoreCase(teamLeader)))
                    .findFirst();
                if (tlOpt.isPresent()) {
                    User tl = tlOpt.get();
                    users = userManagementUseCase.getAuditors(
                        tl.getAuditType() != null ? tl.getAuditType() : (auditType != null ? auditType : ""),
                        tl.getAssignedLocation() != null ? tl.getAssignedLocation() : (taxCenter != null ? taxCenter : "")
                    );

                    // STRICT TEAM LEADER AUDITOR SCOPING:
                    // Return ONLY auditors who report directly to this Team Leader!
                    // In canonical MoR naming: u-tl-{tc}-{auditType}-{tlNum} -> u-aud-{tc}-{auditType}-{tlNum}-
                    String tlUsername = tl.getUsername();
                    if (tlUsername != null && tlUsername.startsWith("u-tl-")) {
                        String expectedAuditorPrefix = tlUsername.replaceFirst("^u-tl-", "u-aud-") + "-";
                        List<User> scoped = users.stream()
                            .filter(u -> u.getUsername() != null && u.getUsername().startsWith(expectedAuditorPrefix))
                            .collect(Collectors.toList());
                        if (!scoped.isEmpty()) {
                            users = scoped;
                        }
                    }
                } else {
                    users = userManagementUseCase.getAuditors(
                        auditType != null ? auditType : "",
                        taxCenter != null ? taxCenter : "");
                }
            } else {
                users = userManagementUseCase.getAuditors(
                    auditType != null ? auditType : "",
                    taxCenter != null ? taxCenter : "");
            }
        } else {
            users = userManagementUseCase.getAllUsers();
        }

        return ResponseEntity.ok(
            users.stream().map(this::mapUserToResponse).collect(java.util.stream.Collectors.toList())
        );
    }

    @GetMapping("/{userId}")
    public ResponseEntity<UserResponse> getUserById(
            @PathVariable UUID userId,
            @RequestHeader("X-Actor-Id") String actorId) {
        try {
            User user = userManagementUseCase.getUserById(userId);
            return ResponseEntity.ok(mapUserToResponse(user));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        }
    }

    @PostMapping("/{userId}/assign-audit-type")
    public ResponseEntity<UserResponse> assignAuditType(
            @PathVariable UUID userId,
            @RequestParam String auditType,
            @RequestHeader("X-Actor-Id") String actorId) {
        try {
            User user = userManagementUseCase.assignAuditType(userId, auditType, actorId);
            return ResponseEntity.ok(mapUserToResponse(user));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
        }
    }

    @PostMapping("/{userId}/deactivate")
    public ResponseEntity<UserResponse> deactivateUser(
            @PathVariable UUID userId,
            @RequestHeader("X-Actor-Id") String actorId) {
        try {
            User user = userManagementUseCase.deactivateUser(userId, actorId);
            return ResponseEntity.ok(mapUserToResponse(user));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        }
    }

    @GetMapping("/statistics")
    public ResponseEntity<Map<String, Object>> getStatistics(
            @RequestHeader("X-Actor-Id") String actorId) {
        Map<String, Object> stats = userManagementUseCase.getUserStatistics();
        return ResponseEntity.ok(stats);
    }

    private UserResponse mapUserToResponse(User user) {
        return UserResponse.builder()
            .userId(user.getUserId())
            .username(user.getUsername())
            .email(user.getEmail())
            .fullName(user.getFullName())
            .userType(user.getUserType())
            .auditType(user.getAuditType())
            .assignedLevel(user.getAssignedLevel())
            .assignedLocation(user.getAssignedLocation())
            .status(user.getStatus())
            .createdDate(user.getCreatedDate())
            .lastModified(user.getLastModified())
            .build();
    }
}
