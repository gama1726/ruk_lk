package ru.ruc.lk.ruk_lk_api.certificates;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.UUID;

import org.springframework.stereotype.Service;

@Service
public class CertificateStorageService {

    private final Path root;

    public CertificateStorageService(CertificateProperties properties) throws IOException {
        this.root = Path.of(properties.storageDir()).toAbsolutePath().normalize();
        Files.createDirectories(root);
    }

    public String save(UUID requestId, UUID attachmentId, String extension, byte[] bytes) throws IOException {
        String safeExt = extension == null || extension.isBlank() ? "bin" : extension.replaceAll("[^a-zA-Z0-9]", "");
        if (safeExt.isBlank()) {
            safeExt = "bin";
        }
        Path dir = root.resolve(requestId.toString());
        Files.createDirectories(dir);
        String fileName = attachmentId + "." + safeExt.toLowerCase();
        Files.write(dir.resolve(fileName), bytes);
        return requestId + "/" + fileName;
    }

    public byte[] read(String storageKey) throws IOException {
        if (storageKey == null || storageKey.isBlank()) {
            throw new IOException("Файл удалён");
        }
        Path target = root.resolve(storageKey).normalize();
        if (!target.startsWith(root)) {
            throw new IOException("Некорректный путь файла");
        }
        return Files.readAllBytes(target);
    }

    public void delete(String storageKey) {
        if (storageKey == null || storageKey.isBlank()) {
            return;
        }
        try {
            Path target = root.resolve(storageKey).normalize();
            if (target.startsWith(root)) {
                Files.deleteIfExists(target);
            }
        } catch (IOException ignored) {
            // best-effort
        }
    }
}
