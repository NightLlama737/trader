"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTypewriter } from "../(homepage)/useTypeWriter";

export default function Auth() {
  const [emailOrNick, setEmailOrNick] = useState("");
  const [nickname, setNickname] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [userExists, setUserExists] = useState<boolean | null>(null); // null = not checked yet, true = user found, false = user NOT found
  const [showText, setShowText] = useState(false); // new state for delayed text
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(() => setShowText(true), 5000); // show text after 5 seconds
    return () => clearTimeout(timer);
  }, []);

  const animatedText =
    userExists === null
      ? "Enter your email or nickname"
      : userExists === true
      ? "User found — login"
      : "User not found — create account";

  const title = useTypewriter(showText ? animatedText : "", 40); // only start typewriter after 5s

  const findUser = async () => {
    const response = await fetch(`/api/findUser`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ emailOrNick }),
    });

    const data = await response.json();
    const exists = data.user ? true : false;

    setUserExists(exists);
  };

  const login = async () => {
    const response = await fetch(`/api/logIn`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ emailOrNick, password }),
    });

    if (response.ok) {
      router.push("/lobby");
    }
  };

  const signup = async () => {
    const response = await fetch(`/api/signUp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, nickname, password }),
    });

    if (response.ok) router.push("/lobby");
  };

  return (
    <div
      style={{
        color: "white",
        display: "flex",
        alignItems: "center",
        width: "80%",
        flexDirection: "column",
        gap: "10px",
      }}
    >
      <h2>{title}</h2>

      {userExists === null && (
        <>
          <input
            type="text"
            style={{
              borderRadius: "5px",
              color: "white",
              border: "1px solid aqua",
              width: "40%",
              backgroundColor: "black",
            }}
            value={emailOrNick}
            onChange={(e) => setEmailOrNick(e.target.value)}
          />

          <button
            style={{
              marginTop: "20px",
              height: "40px",
              borderRadius: "5px",
              color: "white",
              border: "1px solid aqua",
              width: "10%",
              backgroundColor: "black",
            }}
            onClick={findUser}
          >
            Find User
          </button>
        </>
      )}

      {userExists === true && (
        <>
          <input
            style={{
              borderRadius: "5px",
              color: "white",
              border: "1px solid aqua",
              width: "40%",
              backgroundColor: "black",
            }}
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <button
            style={{
              marginTop: "20px",
              height: "40px",
              borderRadius: "5px",
              color: "white",
              border: "1px solid aqua",
              width: "10%",
              backgroundColor: "black",
            }}
            onClick={login}
          >
            Login
          </button>
        </>
      )}

      {userExists === false && (
        <>
          <input
            style={{
              borderRadius: "5px",
              color: "white",
              border: "1px solid aqua",
              width: "40%",
              backgroundColor: "black",
            }}
            type="text"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <input
            style={{
              borderRadius: "5px",
              color: "white",
              border: "1px solid aqua",
              width: "40%",
              backgroundColor: "black",
            }}
            type="text"
            placeholder="Nickname"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
          />

          <input
            style={{
              borderRadius: "5px",
              color: "white",
              border: "1px solid aqua",
              width: "40%",
              backgroundColor: "black",
            }}
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <button
            style={{
              marginTop: "20px",
              height: "40px",
              borderRadius: "5px",
              color: "white",
              border: "1px solid aqua",
              width: "10%",
              backgroundColor: "black",
            }}
            onClick={signup}
          >
            Sign Up
          </button>
        </>
      )}
    </div>
  );
}
