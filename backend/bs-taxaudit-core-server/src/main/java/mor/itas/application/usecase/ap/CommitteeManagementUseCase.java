package mor.itas.application.usecase.ap;

import mor.itas.application.port.inboundport.ap.CommitteeManagementPort;
import mor.itas.application.port.outboundport.repositoryport.ap.CommitteeRepository;
import mor.itas.application.port.outboundport.repositoryport.ap.UserRepository;
import mor.itas.domain.model.ap.Committee;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CommitteeManagementUseCase implements CommitteeManagementPort {
    private final CommitteeRepository committeeRepository;
    private final UserRepository userRepository;

    @Override
    @Transactional
    public Committee createCommittee(String committeeName, String committeeType, String level,
                                   String location, UUID chairId, String actorId) {
        if (committeeRepository.findByName(committeeName).isPresent()) {
            throw new IllegalArgumentException("Committee with name '" + committeeName + "' already exists");
        }
        if (!userRepository.findById(chairId).isPresent()) {
            throw new IllegalArgumentException("Chair user not found with id: " + chairId);
        }
        
        Committee committee = new Committee(committeeName, committeeType, level, location, chairId, actorId);
        committee.addMember(chairId);
        return committeeRepository.save(committee);
    }

    @Override
    public Committee getCommitteeById(UUID committeeId) {
        return committeeRepository.findById(committeeId)
            .orElseThrow(() -> new IllegalArgumentException("Committee not found with id: " + committeeId));
    }

    @Override
    public List<Committee> getAllCommittees() {
        return committeeRepository.findAll();
    }

    @Override
    @Transactional
    public Committee addMember(UUID committeeId, UUID memberId, String actorId) {
        Committee committee = getCommitteeById(committeeId);
        if (!userRepository.findById(memberId).isPresent()) {
            throw new IllegalArgumentException("User not found with id: " + memberId);
        }
        committee.addMember(memberId);
        return committeeRepository.update(committee);
    }

    @Override
    @Transactional
    public Committee removeMember(UUID committeeId, UUID memberId, String actorId) {
        Committee committee = getCommitteeById(committeeId);
        committee.removeMember(memberId);
        return committeeRepository.update(committee);
    }

    @Override
    @Transactional
    public Committee changeChair(UUID committeeId, UUID newChairId, String actorId) {
        Committee committee = getCommitteeById(committeeId);
        if (!userRepository.findById(newChairId).isPresent()) {
            throw new IllegalArgumentException("User not found with id: " + newChairId);
        }
        if (!committee.isMember(newChairId) && !newChairId.equals(committee.getChairId())) {
            committee.addMember(newChairId);
        }
        committee.changeChair(newChairId);
        return committeeRepository.update(committee);
    }

    @Override
    @Transactional
    public Committee updateCapacity(UUID committeeId, Integer newCapacity, String actorId) {
        Committee committee = getCommitteeById(committeeId);
        if (newCapacity <= 0) {
            throw new IllegalArgumentException("Capacity must be greater than 0");
        }
        committee.updateCapacity(newCapacity);
        return committeeRepository.update(committee);
    }

    @Override
    @Transactional
    public Committee deactivateCommittee(UUID committeeId, String actorId) {
        Committee committee = getCommitteeById(committeeId);
        committee.deactivate();
        return committeeRepository.update(committee);
    }

    @Override
    public Committee getNationalJACommittee() {
        return committeeRepository.getNationalJACommittee()
            .orElseThrow(() -> new IllegalArgumentException("National JA Committee not found"));
    }

    @Override
    public Committee getNationalTPCommittee() {
        return committeeRepository.getNationalTPCommittee()
            .orElseThrow(() -> new IllegalArgumentException("National TP Committee not found"));
    }

    @Override
    public Map<String, Object> getWorkloadInfo(UUID committeeId) {
        Committee committee = getCommitteeById(committeeId);
        Map<String, Object> workload = new HashMap<>();
        workload.put("committeeId", committeeId.toString());
        workload.put("committeeName", committee.getCommitteeName());
        workload.put("capacity", committee.getCapacity());
        workload.put("currentLoad", committee.getCurrentLoad());
        workload.put("availableCapacity", committee.getRemainingCapacity());
        workload.put("utilizationPercentage", Math.round(
            (double) committee.getCurrentLoad() / committee.getCapacity() * 100));
        return workload;
    }

    @Override
    public Map<String, Object> getCommitteeStatistics() {
        Map<String, Object> stats = new HashMap<>();
        List<Committee> allCommittees = committeeRepository.findAll();
        stats.put("totalCommittees", allCommittees.size());
        stats.put("activeCommittees", allCommittees.stream()
            .filter(c -> "ACTIVE".equals(c.getStatus())).count());
        Map<String, Long> byType = allCommittees.stream()
            .collect(Collectors.groupingBy(Committee::getCommitteeType, Collectors.counting()));
        stats.put("byType", byType);
        return stats;
    }
}
