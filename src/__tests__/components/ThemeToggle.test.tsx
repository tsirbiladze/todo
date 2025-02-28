import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { ThemeProvider } from "@/app/theme-provider";
import { ThemeToggle } from "@/components/ThemeToggle";
import '@testing-library/jest-dom';

// Mock the next-themes useTheme hook
jest.mock("next-themes", () => ({
  useTheme: jest.fn(() => ({
    theme: "light",
    setTheme: jest.fn(),
    themes: ["light", "dark", "system"],
  })),
}));

describe("ThemeToggle Component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders correctly with default theme", () => {
    const { useTheme } = require("next-themes");
    const mockSetTheme = jest.fn();
    
    // Mock initial theme as light
    useTheme.mockImplementation(() => ({
      theme: "light",
      setTheme: mockSetTheme,
      themes: ["light", "dark", "system"],
    }));

    render(
      <ThemeProvider>
        <ThemeToggle />
      </ThemeProvider>
    );

    // Button should be visible
    const themeButton = screen.getByRole("button", { name: /change theme/i });
    expect(themeButton).toBeInTheDocument();
  });

  it("changes theme when clicked", async () => {
    const { useTheme } = require("next-themes");
    const mockSetTheme = jest.fn();
    
    // Mock initial theme as light
    useTheme.mockImplementation(() => ({
      theme: "light",
      setTheme: mockSetTheme,
      themes: ["light", "dark", "system"],
    }));

    render(
      <ThemeProvider>
        <ThemeToggle />
      </ThemeProvider>
    );

    // Click the theme toggle button
    const themeButton = screen.getByRole("button", { name: /change theme/i });
    fireEvent.click(themeButton);

    // Should show theme options
    await waitFor(() => {
      expect(screen.getByText(/dark/i)).toBeInTheDocument();
    });

    // Select dark theme
    fireEvent.click(screen.getByText(/dark/i));
    
    // Should call setTheme with 'dark'
    expect(mockSetTheme).toHaveBeenCalledWith('dark');
  });

  it("renders with different initial theme", async () => {
    const { useTheme } = require("next-themes");
    const mockSetTheme = jest.fn();
    
    // Mock initial theme as dark
    useTheme.mockImplementation(() => ({
      theme: "dark",
      setTheme: mockSetTheme,
      themes: ["light", "dark", "system"],
    }));

    render(
      <ThemeProvider>
        <ThemeToggle />
      </ThemeProvider>
    );

    // Button should show dark mode icon
    const themeButton = screen.getByRole("button", { name: /change theme/i });
    expect(themeButton).toBeInTheDocument();
    
    // Click the theme toggle button
    fireEvent.click(themeButton);
    
    // Should show theme options
    await waitFor(() => {
      expect(screen.getByText(/light/i)).toBeInTheDocument();
    });
    
    // Select light theme
    fireEvent.click(screen.getByText(/light/i));
    
    // Should call setTheme with 'light'
    expect(mockSetTheme).toHaveBeenCalledWith('light');
  });
}); 