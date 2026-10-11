package mor.itas.api.controller.backoffice.ap;

import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import mor.itas.infrastructure.security.BackofficeSecurityService;
import mor.itas.infrastructure.security.BackofficeSecurityService.AuthResult;
import mor.itas.infrastructure.security.BackofficeSecurityService.UserSecurityRecord;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.LinkedHashMap;
import java.util.Map;

/**
 * REST Controller for MOR ITAS Back-Office Authentication, Password Management,
 * and System Administrator Security Operations.
 */
@RestController
@RequestMapping("/api/v1/backoffice/auth")
@RequiredArgsConstructor
public class BackofficeAuthController {

    private final BackofficeSecurityService securityService;

    @PostMapping("/login")
    public ResponseEntity<Map<String, Object>> login(
            @RequestBody Map<String, Object> body,
            HttpServletRequest request) {
        String identifier = body.get("identifier") != null
                ? body.get("identifier").toString()
                : (body.get("username") != null ? body.get("username").toString() : (body.get("email") != null ? body.get("email").toString() : ""));
        String password = body.get("password") != null ? body.get("password").toString() : "";
        String ipAddress = extractClientIp(request);

        AuthResult result = securityService.authenticate(identifier, password, ipAddress);

        Map<String, Object> response = new LinkedHashMap<>();
        response.put("success", result.isSuccess());
        response.put("message", result.getMessage());
        if (result.getErrorCode() != null) response.put("errorCode", result.getErrorCode());
        if (result.getRemainingAttempts() != null) response.put("remainingAttempts", result.getRemainingAttempts());
        if (result.getLockedUntil() != null) response.put("lockedUntil", result.getLockedUntil());
        if (result.isSuccess()) {
            response.put("token", result.getToken());
            response.put("expiresIn", result.getExpiresIn());
            response.put("mustChangePassword", result.isMustChangePassword());
            response.put("user", result.getUser());
        }
        return ResponseEntity.status(result.getHttpStatus()).body(response);
    }

    @PostMapping("/change-password")
    public ResponseEntity<Map<String, Object>> changePassword(
            @RequestBody Map<String, Object> body,
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @RequestHeader(value = "X-Actor-Id", required = false) String actorId,
            HttpServletRequest request) {
        try {
            String identifier = body.get("identifier") != null ? body.get("identifier").toString() : actorId;
            if ((identifier == null || identifier.isBlank()) && authHeader != null) {
                UserSecurityRecord tokenUser = securityService.verifyJwtToken(authHeader);
                if (tokenUser != null) identifier = tokenUser.getUsername();
            }
            String currentPassword = body.get("currentPassword") != null ? body.get("currentPassword").toString() : "";
            String newPassword = body.get("newPassword") != null ? body.get("newPassword").toString() : "";

            Map<String, Object> res = securityService.changePassword(identifier, currentPassword, newPassword, extractClientIp(request));
            return ResponseEntity.ok(res);
        } catch (IllegalArgumentException e) {
            Map<String, Object> err = new LinkedHashMap<>();
            err.put("success", false);
            err.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(err);
        }
    }

    @GetMapping("/me")
    public ResponseEntity<Map<String, Object>> getCurrentUser(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @RequestHeader(value = "X-Actor-Id", required = false) String actorId) {
        UserSecurityRecord rec = null;
        if (authHeader != null && !authHeader.isBlank()) {
            rec = securityService.verifyJwtToken(authHeader);
        }
        if (rec == null && actorId != null && !actorId.isBlank()) {
            rec = securityService.resolveSecurityRecord(actorId);
        }
        if (rec == null) {
            return ResponseEntity.status(401).body(Map.of("success", false, "message", "Invalid or expired session token."));
        }
        return ResponseEntity.ok(Map.of("success", true, "user", securityService.toUserMap(rec)));
    }

    // ════════════════════════════════════════════════════════════════════════════
    // SYSTEM ADMIN ENDPOINTS
    // ════════════════════════════════════════════════════════════════════════════

    @GetMapping("/admin/users")
    public ResponseEntity<Map<String, Object>> getAllUsersForAdmin() {
        Map<String, Object> res = new LinkedHashMap<>();
        res.put("success", true);
        res.put("metrics", securityService.getSecurityMetrics());
        res.put("users", securityService.getAllUsersWithSecurityState());
        return ResponseEntity.ok(res);
    }

    @PostMapping("/admin/users")
    public ResponseEntity<Map<String, Object>> createUserByAdmin(
            @RequestBody Map<String, Object> body,
            @RequestHeader(value = "X-Actor-Id", defaultValue = "sysadmin-01") String adminActor) {
        try {
            String username = body.get("username") != null ? body.get("username").toString() : "";
            String email = body.get("email") != null ? body.get("email").toString() : "";
            String fullName = body.get("fullName") != null ? body.get("fullName").toString() : "";
            String userType = body.get("userType") != null ? body.get("userType").toString() : "AUDITOR";
            String assignedLevel = body.get("assignedLevel") != null ? body.get("assignedLevel").toString() : "TAX_CENTER";
            String assignedLocation = body.get("assignedLocation") != null ? body.get("assignedLocation").toString() : null;
            String auditType = body.get("auditType") != null ? body.get("auditType").toString() : null;
            String initialPassword = body.get("initialPassword") != null ? body.get("initialPassword").toString() : BackofficeSecurityService.DEFAULT_INITIAL_PASSWORD;
            boolean mustChangePassword = body.get("mustChangePassword") == null || Boolean.parseBoolean(body.get("mustChangePassword").toString());

            Map<String, Object> created = securityService.adminCreateUser(
                    adminActor, username, email, fullName, userType, assignedLevel,
                    assignedLocation, auditType, initialPassword, mustChangePassword);

            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "User account provisioned with BCrypt password protection.",
                    "user", created
            ));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", e.getMessage()));
        }
    }

    @PostMapping("/admin/reset-password")
    public ResponseEntity<Map<String, Object>> resetPasswordByAdmin(
            @RequestBody Map<String, Object> body,
            @RequestHeader(value = "X-Actor-Id", defaultValue = "sysadmin-01") String adminActor) {
        try {
            String targetUser = body.get("username") != null ? body.get("username").toString() :
                    (body.get("userId") != null ? body.get("userId").toString() : "");
            String tempPassword = body.get("temporaryPassword") != null ? body.get("temporaryPassword").toString() : BackofficeSecurityService.DEFAULT_INITIAL_PASSWORD;
            boolean forceChange = body.get("mustChangePassword") == null || Boolean.parseBoolean(body.get("mustChangePassword").toString());

            Map<String, Object> updated = securityService.adminResetPassword(adminActor, targetUser, tempPassword, forceChange);
            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "Password reset successfully for " + updated.get("username"),
                    "user", updated
            ));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", e.getMessage()));
        }
    }

    @PostMapping("/admin/unlock/{identifier}")
    public ResponseEntity<Map<String, Object>> unlockUserByAdmin(
            @PathVariable String identifier,
            @RequestHeader(value = "X-Actor-Id", defaultValue = "sysadmin-01") String adminActor) {
        try {
            Map<String, Object> updated = securityService.adminUnlockUser(adminActor, identifier);
            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "Account unlocked and failed login counter reset.",
                    "user", updated
            ));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", e.getMessage()));
        }
    }

    @PostMapping("/admin/status/{identifier}")
    public ResponseEntity<Map<String, Object>> toggleStatusByAdmin(
            @PathVariable String identifier,
            @RequestBody Map<String, Object> body,
            @RequestHeader(value = "X-Actor-Id", defaultValue = "sysadmin-01") String adminActor) {
        try {
            String status = body.get("status") != null ? body.get("status").toString() : "ACTIVE";
            Map<String, Object> updated = securityService.adminToggleStatus(adminActor, identifier, status);
            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "Account status updated to " + updated.get("status"),
                    "user", updated
            ));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", e.getMessage()));
        }
    }

    @PutMapping("/admin/scope/{identifier}")
    public ResponseEntity<Map<String, Object>> updateScopeByAdmin(
            @PathVariable String identifier,
            @RequestBody Map<String, Object> body,
            @RequestHeader(value = "X-Actor-Id", defaultValue = "sysadmin-01") String adminActor) {
        try {
            String fullName = body.get("fullName") != null ? body.get("fullName").toString() : null;
            String email = body.get("email") != null ? body.get("email").toString() : null;
            String userType = body.get("userType") != null ? body.get("userType").toString() : null;
            String assignedLevel = body.get("assignedLevel") != null ? body.get("assignedLevel").toString() : null;
            String assignedLocation = body.get("assignedLocation") != null ? body.get("assignedLocation").toString() : null;
            String auditType = body.get("auditType") != null ? body.get("auditType").toString() : null;

            Map<String, Object> updated = securityService.adminUpdateScope(
                    adminActor, identifier, fullName, email, userType, assignedLevel, assignedLocation, auditType);
            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "Organizational scope and role assignment updated.",
                    "user", updated
            ));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", e.getMessage()));
        }
    }

    @GetMapping("/admin/security-logs")
    public ResponseEntity<Map<String, Object>> getSecurityLogs() {
        Map<String, Object> res = new LinkedHashMap<>();
        res.put("success", true);
        res.put("metrics", securityService.getSecurityMetrics());
        res.put("logs", securityService.getSecurityAuditLogs());
        return ResponseEntity.ok(res);
    }

    private String extractClientIp(HttpServletRequest request) {
        if (request == null) return "127.0.0.1";
        String xff = request.getHeader("X-Forwarded-For");
        if (xff != null && !xff.isBlank()) {
            return xff.split(",")[0].trim();
        }
        return request.getRemoteAddr() != null ? request.getRemoteAddr() : "127.0.0.1";
    }
}
