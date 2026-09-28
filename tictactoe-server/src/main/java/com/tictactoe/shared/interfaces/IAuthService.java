package com.tictactoe.shared.interfaces;

import com.tictactoe.shared.Message;

public interface IAuthService {
    Message register(String username, String password);
    Message login(String username, String password);
}
