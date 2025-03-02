'use client';

export const fetchUserProfile = async () => {
  const token = localStorage.getItem("authToken");
  if (!token) {
    return { error: true, message: "Token not found" };
  }
  try {
    const response = await fetch("/api/auth/user", {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!response.ok) {
      const errorData = await response.json();
      return { error: true, message: errorData.message || "Error fetching profile" };
    }
    const data = await response.json();
    return { user: data.user };
  } catch (error) {
    return { error: true, message: "Failed to load profile" };
  }
};
