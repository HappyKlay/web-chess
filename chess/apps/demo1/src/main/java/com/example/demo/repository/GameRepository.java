package com.example.demo.repository;

import com.example.demo.model.Game;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.repository.CrudRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface GameRepository extends JpaRepository<Game, Integer> {
    List<Game> findByWhitePlayerIdIsNullOrBlackPlayerIdIsNull();
}
