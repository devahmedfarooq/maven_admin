'use client'
import { redirect } from "next/navigation";

export default function Page() {

  const token = localStorage.getItem('authToken')
  if (!token) {
    redirect("/auth");
  }
  redirect("/dashboard");

}