"use client";
import { useState } from "react";
import { useSearchParams } from "next/navigation";

export default function AddModelTrade() {
  const searchParams = useSearchParams();
  const s3Key = searchParams.get("s3Key");

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState(0);

  const handleSubmit = async () => {
    if (!s3Key) return alert("Missing S3 key!");

    try {
      const res = await fetch("/api/offModelTrade", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          s3Key, // ✅ POSÍLÁME KEY
          name,
          description,
          price,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        alert("Model added to trade!");
      } else {
        alert("Error: " + data.error);
      }
    } catch (err) {
      console.error(err);
      alert("Something went wrong.");
    }
  };

  return (
    <div style={{ padding: 20 }}>
      <h2>Add Model to Trade</h2>

      <input
        placeholder="Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
      <input
        placeholder="Description"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
      />
      <input
        placeholder="Price"
        type="number"
        value={price}
        onChange={(e) => setPrice(Number(e.target.value))}
      />

      <button onClick={handleSubmit}>Submit</button>
    </div>
  );
}
