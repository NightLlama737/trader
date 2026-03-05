"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Pass } from "three/examples/jsm/Addons.js";
import { log } from "console";

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
        width: "800px",
        padding: "100px",
        flexDirection: "column",
        gap: "10px",
      }}
    >
      <h2>Enter your email or nickname</h2>

      {userExists === null && (
        <>
          <label style={{ width: "100%" }}>
            Email or Nickname:
            <input
              type="text"
              style={{
                color: "lightgray",
                outline: "none" /* odstraní standardní ohraničení při focus */,
                paddingLeft: "10px",
                border: "none",
                width: "60%",
                backgroundColor: "black",
              }}
              value={emailOrNick}
              onChange={(e) => setEmailOrNick(e.target.value)}
            />
          </label>

          <button
          
            style={{
              marginTop: "20px",
              height: "40px",
              borderRadius: "5px",
              border: "none",
              width: "40%",
              color: "white",
              backgroundColor: "black",
              cursor: "pointer", // ukazatel
              transition: "background-color 0.3s", // plynulá změna barvy
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "lightgray")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "white")}
            onClick={findUser}
          >
            <h2>Find User</h2>
          </button>
        </>
      )}

      {userExists === true && (
        <>
          <label style={{ width: "100%"}}>
            Password:
            <input
              type="password"
              style={{
                outline: "none" /* odstraní standardní ohraničení při focus */,
                paddingLeft: "10px",
                border: "none",
                width: "70%",
                backgroundColor: "black",
              }}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </label>

          <button
            style={{
              marginTop: "20px",
              height: "40px",
              borderRadius: "5px",
              border: "none",
              width: "40%",
                            color: "white",
              backgroundColor: "black",
              cursor: "pointer", // ukazatel
              transition: "background-color 0.3s", // plynulá změna barvy
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "lightgray")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "white")}
            onClick={login}
          >
            <h2>Log in</h2>
          </button>
        </>
      )}

      {userExists === false && (
        <>
          <label style={{ width: "100%"}}>
            Email:
            <input
              type="text"
              style={{
                outline: "none" /* odstraní standardní ohraničení při focus */,
                paddingLeft: "10px",
                border: "none",
                width: "70%",
                backgroundColor: "black",
              }}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </label>

          <label style={{ width: "100%"}}>
            Nickname:
            <input
              type="text"
              style={{
                outline: "none" /* odstraní standardní ohraničení při focus */,
                color: "white",
                paddingLeft: "10px",
                border: "none",
                width: "70%",
                backgroundColor: "black",
              }}
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
            />
          </label>

          <label style={{ width: "100%"}}>
            Password:
            <input
              type="password"
              style={{
                outline: "none" /* odstraní standardní ohraničení při focus */,
                paddingLeft: "10px",
                border: "none",
                width: "70%",
                backgroundColor: "black",
              }}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </label>

          <button
            style={{
              marginTop: "20px",
              height: "40px",
              borderRadius: "5px",
              color: "white",
              border: "none",
              width: "40%",
              backgroundColor: "black",
              cursor: "pointer", // ukazatel
              transition: "background-color 0.3s", // plynulá změna barvy
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "lightgray")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "white")}
            onClick={signup}
          >
            <h2>Sign Up</h2>
          </button>
        </>
      )}
    </div>
  );
}
