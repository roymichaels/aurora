import { saveProfile, loadProfile } from "./storage";

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
});
