package com.example.demo.repository;

import com.example.demo.model.WaitingRoom;

import org.springframework.stereotype.Repository;
import org.springframework.data.repository.CrudRepository;

import java.util.Optional;

@Repository
public interface WaitingRoomRepository extends CrudRepository<WaitingRoom, Long> {
    Optional<WaitingRoom> findByGameCode(String gameCode);
    Optional<WaitingRoom> findByHostIdAndActive(Long hostId, boolean active);
}
