import {
  saveProfile,
  loadProfile,
  exportProfile,
  deleteProfile,
} from "./storage";

describe("storage", () => {
  it("saves and loads profile with encryption", () => {
    const profile = {
      userId: "user1",
      password: "password123",
      name: "Alice",
      goals: ["grow"],
    };

    saveProfile(profile);
    const loaded = loadProfile("user1", "password123");
    expect(loaded).toEqual({ userId: "user1", name: "Alice", goals: ["grow"] });
  });

  it("exports and deletes profile", () => {
    const profile = {
      userId: "user2",
      password: "pass456",
      name: "Bob",
    };

    saveProfile(profile);
    const exported = exportProfile("user2");
    expect(exported).toBeTruthy();

    deleteProfile("user2");
    const loaded = loadProfile("user2", "pass456");
    expect(loaded).toBeNull();
  });
});
