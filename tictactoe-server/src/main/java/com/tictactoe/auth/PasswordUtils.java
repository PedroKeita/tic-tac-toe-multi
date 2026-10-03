package com.tictactoe.auth;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;


public final class PasswordUtils {

    private static final String HASH_ALGORITHM = "SHA-256";

    private PasswordUtils() {
        throw new UnsupportedOperationException("Classe utilitária não deve ser instanciada");
    }

    // Gera o hash SHA-256 hexadecimal da senha fornecida.
    public static String hashPassword(String password) {
        if (password == null || password.isEmpty()) {
            throw new IllegalArgumentException("A senha não pode ser nula ou vazia");
        }

        try {
            MessageDigest digest = MessageDigest.getInstance(HASH_ALGORITHM);
            byte[] hashBytes = digest.digest(password.getBytes(StandardCharsets.UTF_8));
            return bytesToHex(hashBytes);
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("Algoritmo " + HASH_ALGORITHM + " indisponível no ambiente", e);
        }
    }

    // Valida a senha contra o hash armazenado usando comparação de tempo constante
    public static boolean verifyPassword(String rawPassword, String storedHash) {
        if (rawPassword == null || storedHash == null) {
            return false;
        }

        String computedHash = hashPassword(rawPassword);
        return MessageDigest.isEqual(
                computedHash.getBytes(StandardCharsets.UTF_8),
                storedHash.getBytes(StandardCharsets.UTF_8)
        );
    }

    // Converte o array de bytes para string hexadecimal formatada.
    private static String bytesToHex(byte[] bytes) {
        StringBuilder hexString = new StringBuilder(bytes.length * 2);
        for (byte b : bytes) {
            String hex = Integer.toHexString(0xff & b);
            if (hex.length() == 1) {
                hexString.append('0');
            }
            hexString.append(hex);
        }
        return hexString.toString();
    }
}
