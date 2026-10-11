package mor.itas.application.usecase.ap;

import mor.itas.application.port.inboundport.ap.UserManagementPort;
import mor.itas.application.port.outboundport.repositoryport.ap.UserRepository;
import mor.itas.domain.model.ap.User;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class UserManagementUseCase implements UserManagementPort {
    private final UserRepository userRepository;

    @Override
    @Transactional
    public User createUser(String username, String email, String fullName, String userType, 
                          String auditType, String assignedLevel, String assignedLocation, String actorId) {
        if (userRepository.findByUsername(username).isPresent()) {
            throw new IllegalArgumentException("User with username '" + username + "' already exists");
        }
        if (userRepository.findByEmail(email).isPresent()) {
            throw new IllegalArgumentException("User with email '" + email + "' already exists");
        }
        
        User user = auditType != null && !auditType.isEmpty() ?
            new User(username, email, fullName, userType, auditType, assignedLevel, assignedLocation, actorId) :
            new User(username, email, fullName, userType, assignedLevel, assignedLocation, actorId);
        
        return userRepository.save(user);
    }

    @Override
    public User getUserById(UUID userId) {
        return userRepository.findById(userId)
            .orElseThrow(() -> new IllegalArgumentException("User not found with id: " + userId));
    }

    @Override
    public User getUserByUsername(String username) {
        return userRepository.findByUsername(username).orElse(null);
    }

    @Override
    public List<User> getAllUsers() {
        return userRepository.findAll();
    }

    @Override
    public List<User> getTeamLeaders(String auditType, String taxCenterCode) {
        return userRepository.findByUserTypeAuditTypeAndLocation("TEAM_LEADER", auditType, taxCenterCode);
    }

    @Override
    public List<User> getAuditors(String auditType, String taxCenterCode) {
        return userRepository.findByUserTypeAuditTypeAndLocation("AUDITOR", auditType, taxCenterCode);
    }

    @Override
    @Transactional
    public User updateUser(UUID userId, String email, String fullName, String actorId) {
        User user = getUserById(userId);
        if (email != null && !email.equals(user.getEmail())) {
            if (userRepository.findByEmail(email).isPresent()) {
                throw new IllegalArgumentException("Email '" + email + "' is already in use");
            }
        }
        if (email != null && !email.isEmpty()) {
            user.updateContactInfo(email);
        }
        return userRepository.update(user);
    }

    @Override
    @Transactional
    public User assignAuditType(UUID userId, String auditType, String actorId) {
        User user = getUserById(userId);
        if (!("TEAM_LEADER".equals(user.getUserType()) || "AUDITOR".equals(user.getUserType()))) {
            throw new IllegalArgumentException("Cannot assign audit type to user type: " + user.getUserType());
        }
        user.updateAssignment(auditType, user.getAssignedLocation());
        return userRepository.update(user);
    }

    @Override
    @Transactional
    public User deactivateUser(UUID userId, String actorId) {
        User user = getUserById(userId);
        user.deactivate();
        return userRepository.update(user);
    }

    @Override
    @Transactional
    public User activateUser(UUID userId, String actorId) {
        User user = getUserById(userId);
        user.activate();
        return userRepository.update(user);
    }

    @Override
    public Map<String, Object> getUserStatistics() {
        Map<String, Object> stats = new HashMap<>();
        List<User> allUsers = userRepository.findAll();
        stats.put("totalUsers", allUsers.size());
        stats.put("activeUsers", allUsers.stream().filter(u -> "ACTIVE".equals(u.getStatus())).count());
        Map<String, Long> byType = allUsers.stream()
            .collect(Collectors.groupingBy(User::getUserType, Collectors.counting()));
        stats.put("byUserType", byType);
        return stats;
    }
}
