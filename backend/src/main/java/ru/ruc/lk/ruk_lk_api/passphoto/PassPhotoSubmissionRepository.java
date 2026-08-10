package ru.ruc.lk.ruk_lk_api.passphoto;

import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PassPhotoSubmissionRepository extends JpaRepository<PassPhotoSubmission, UUID> {

    Optional<PassPhotoSubmission> findFirstByStudentIdOrderBySubmittedAtDesc(String studentId);

    List<PassPhotoSubmission> findByStatusInOrderBySubmittedAtAsc(Collection<PassPhotoStatus> statuses);

    List<PassPhotoSubmission> findByStatus(PassPhotoStatus status);

    List<PassPhotoSubmission> findByStatusInAndEducationTrackOrderBySubmittedAtAsc(
        Collection<PassPhotoStatus> statuses,
        EducationTrack educationTrack
    );

    List<PassPhotoSubmission> findByStatusInAndEducationTrackOrderByReviewedAtDesc(
        Collection<PassPhotoStatus> statuses,
        EducationTrack educationTrack,
        Pageable pageable
    );

    List<PassPhotoSubmission> findByEducationTrackIsNull();
}
