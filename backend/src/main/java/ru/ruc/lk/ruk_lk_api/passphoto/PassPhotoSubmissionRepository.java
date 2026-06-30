package ru.ruc.lk.ruk_lk_api.passphoto;

import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PassPhotoSubmissionRepository extends JpaRepository<PassPhotoSubmission, UUID> {

    Optional<PassPhotoSubmission> findFirstByStudentIdOrderBySubmittedAtDesc(String studentId);

    Optional<PassPhotoSubmission> findFirstByStudentIdAndStatus(String studentId, PassPhotoStatus status);

    List<PassPhotoSubmission> findByStatusOrderBySubmittedAtAsc(PassPhotoStatus status);

    List<PassPhotoSubmission> findByStatusInOrderByReviewedAtDesc(
        Collection<PassPhotoStatus> statuses,
        Pageable pageable
    );
}
