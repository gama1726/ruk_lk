package ru.ruc.lk.ruk_lk_api.passphoto;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;

@Component
public class PassPhotoTrackBackfill implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(PassPhotoTrackBackfill.class);

    private final PassPhotoService passPhotoService;

    public PassPhotoTrackBackfill(PassPhotoService passPhotoService) {
        this.passPhotoService = passPhotoService;
    }

    @Override
    public void run(ApplicationArguments args) {
        int updated = passPhotoService.backfillEducationTracks();
        if (updated > 0) {
            log.info("Pass-photo: backfill educationTrack для {} заявок", updated);
        }
    }
}
