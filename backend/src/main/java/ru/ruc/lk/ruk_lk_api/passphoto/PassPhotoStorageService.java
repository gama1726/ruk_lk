package ru.ruc.lk.ruk_lk_api.passphoto;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.UUID;

import org.springframework.stereotype.Service;

@Service
public class PassPhotoStorageService {

    private final Path root;

    public PassPhotoStorageService(PassPhotoProperties properties) throws IOException {
        this.root = Path.of(properties.storageDir()).toAbsolutePath().normalize();
        Files.createDirectories(root);
    }

    public String save(UUID submissionId, byte[] bytes) throws IOException {
        String fileName = submissionId + ".jpg";
        Path target = root.resolve(fileName);
        Files.write(target, bytes);
        return fileName;
    }

    public byte[] read(String storedFileName) throws IOException {
        return Files.readAllBytes(root.resolve(storedFileName));
    }

    public void delete(String storedFileName) throws IOException {
        Files.deleteIfExists(root.resolve(storedFileName));
    }
}
