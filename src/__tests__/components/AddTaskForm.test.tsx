import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AddTaskForm } from "@/components/AddTaskForm";
import { useStore } from "@/lib/store";
import '@testing-library/jest-dom';

// Mock the Zustand store
jest.mock("@/lib/store", () => ({
  useStore: jest.fn(),
}));

// Mock fetch API
global.fetch = jest.fn();

// Mock the localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  clear: jest.fn(),
  removeItem: jest.fn(),
  length: 0,
  key: jest.fn(),
};
Object.defineProperty(window, "localStorage", { value: localStorageMock });

describe("AddTaskForm Component", () => {
  const mockAddTask = jest.fn();
  const mockAddCategory = jest.fn();
  const mockOnClose = jest.fn();

  const mockCategories = [
    {
      id: "cat1",
      name: "Work",
      color: "#ff0000",
      userId: "user1",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: "cat2",
      name: "Personal",
      color: "#00ff00",
      userId: "user1",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  // Mock templates data
  const mockTemplates = [
    {
      id: "template1",
      name: "Work Template",
      description: "Template for work tasks",
      userId: "user1",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: "template2",
      name: "Personal Template",
      description: "Template for personal tasks",
      userId: "user1",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock fetch responses
    (global.fetch as jest.Mock).mockImplementation((url) => {
      if (url === "/api/templates") {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockTemplates),
        });
      }

      // Handle task creation specifically
      if (url === "/api/tasks") {
        const mockTaskResponse = {
          id: "new-task-id",
          title: "New Task",
          description: "Task Description",
          priority: "HIGH",
          emotion: "CONFIDENT",
          estimatedDuration: 60,
          dueDate: new Date(),
          createdAt: new Date(),
          updatedAt: new Date(),
          userId: "user1",
          categoryIds: [],
          categories: [],
        };

        return Promise.resolve({
          ok: true,
          headers: {
            get: (header: string) => {
              if (header === "content-type") return "application/json";
              return null;
            },
          },
          json: () => Promise.resolve({ task: mockTaskResponse }),
        });
      }

      // Default response for other API calls
      return Promise.resolve({
        ok: true,
        headers: {
          get: () => "application/json",
        },
        json: () => Promise.resolve({}),
      });
    });

    // Mock the store implementation
    (useStore as unknown as jest.Mock).mockImplementation((selector) => {
      const store = {
        addTask: mockAddTask,
        addCategory: mockAddCategory,
        categories: mockCategories,
      };
      return selector(store);
    });

    // Reset localStorage mock
    localStorageMock.getItem.mockReturnValue(null);
  });

  it("renders the form correctly", async () => {
    render(<AddTaskForm onClose={mockOnClose} />);

    // Wait for the templates to load
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith("/api/templates");
    });

    expect(screen.getByPlaceholderText("Task title")).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText("Description (optional)")
    ).toBeInTheDocument();

    // Updated selectors based on current component structure
    expect(screen.getByText(/Priority/i)).toBeInTheDocument();
    expect(screen.getByText(/Due Date & Time/i)).toBeInTheDocument();
    expect(screen.getByText(/Categories/i)).toBeInTheDocument();
    expect(
      screen.getByText(/How do you feel about this task\?/i)
    ).toBeInTheDocument();
    expect(screen.getByText(/Estimated Duration/i)).toBeInTheDocument();
    expect(screen.getByText("Save Task")).toBeInTheDocument();
  });

  it("validates form input before submission", async () => {
    render(<AddTaskForm onClose={mockOnClose} />);

    // Wait for the templates to load
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith("/api/templates");
    });

    // Click save without entering title
    const saveButton = screen.getByText("Save Task");
    fireEvent.click(saveButton);

    // Should show validation error - using queryAllByText to handle multiple elements
    await waitFor(() => {
      const errorMessages = screen.queryAllByText(/Title is required/i);
      expect(errorMessages.length).toBeGreaterThan(0);
    });

    // Only the templates API call should be made, not the task creation
    expect(global.fetch).toHaveBeenCalledTimes(1);
    expect(global.fetch).not.toHaveBeenCalledWith(
      "/api/tasks",
      expect.any(Object)
    );
  });

  it("submits the form with valid data", async () => {
    const user = userEvent.setup();

    render(<AddTaskForm onClose={mockOnClose} />);

    // Wait for the templates to load
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith("/api/templates");
    });

    // Fill out the form with all required fields
    await user.type(screen.getByPlaceholderText("Task title"), "New Task");
    await user.type(
      screen.getByPlaceholderText("Description (optional)"),
      "Task Description"
    );

    // Select a priority - using buttons instead of select
    const priorityButtons = screen.getAllByRole("button");
    const highPriorityButton = priorityButtons.find(
      (button) => button.textContent === "High"
    );
    if (highPriorityButton) {
      await user.click(highPriorityButton);
    }

    // Select a due date - ensure it's a valid future date
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 7); // 7 days in the future
    const formattedDate = `${futureDate.getFullYear()}-${String(
      futureDate.getMonth() + 1
    ).padStart(2, "0")}-${String(futureDate.getDate()).padStart(2, "0")}`;

    const dueDateInput = screen.getByLabelText(/Due Date & Time/i);
    await user.type(dueDateInput, formattedDate);

    // Set emotional state - find and click the Confident button
    const emotionButtons = screen.getAllByRole("button");
    const confidentButton = emotionButtons.find((button) =>
      button.textContent?.includes("Confident")
    );
    if (confidentButton) {
      await user.click(confidentButton);
    }

    // Set estimated duration
    const durationInput = screen.getByLabelText(/Estimated Duration/i);
    await user.clear(durationInput);
    await user.type(durationInput, "60");

    // Submit the form
    await user.click(screen.getByText("Save Task"));

    // Verify form submission with longer timeout
    await waitFor(
      () => {
        expect(global.fetch).toHaveBeenCalledWith(
          "/api/tasks",
          expect.any(Object)
        );
      },
      { timeout: 3000 }
    );

    // Additional verification
    expect(mockAddTask).toHaveBeenCalled();
    expect(mockOnClose).toHaveBeenCalled();
  });

  it("loads draft from localStorage if available", async () => {
    // Set up localStorage mock to return a draft
    const mockDraft = JSON.stringify({
      title: "Draft Task",
      description: "Draft Description",
      priority: 3, // HIGH
      dueDate: "2023-12-31",
      selectedCategories: ["cat1"],
      emotion: "CONFIDENT",
      estimatedDuration: 45,
    });

    localStorageMock.getItem.mockReturnValue(mockDraft);

    render(<AddTaskForm onClose={mockOnClose} />);

    // Wait for the templates to load
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith("/api/templates");
    });

    // Check if form is populated with draft values
    await waitFor(() => {
      expect(screen.getByDisplayValue("Draft Task")).toBeInTheDocument();
      expect(screen.getByDisplayValue("Draft Description")).toBeInTheDocument();
      expect(screen.getByDisplayValue("45")).toBeInTheDocument();
    });
  });

  it("saves draft to localStorage when form values change", async () => {
    // Mock localStorage implementation for this test
    const mockSetItem = jest.fn();
    const originalSetItem = localStorage.setItem;
    localStorage.setItem = mockSetItem;

    const user = userEvent.setup();
    render(<AddTaskForm onClose={mockOnClose} />);

    // Wait for the templates to load
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith("/api/templates");
    });

    // Type in the title field
    await user.type(screen.getByPlaceholderText("Task title"), "Draft Task");

    // Wait for the debounced localStorage save - use a longer timeout
    await waitFor(
      () => {
        expect(mockSetItem).toHaveBeenCalledWith(
          "taskDraft",
          expect.any(String)
        );
      },
      { timeout: 3000 }
    ); // Increase timeout for debounce

    // Restore original localStorage
    localStorage.setItem = originalSetItem;
  });
});
