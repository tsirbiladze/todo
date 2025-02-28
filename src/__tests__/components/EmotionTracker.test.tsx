import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { EmotionTracker } from '@/components/EmotionTracker';
import { emotionOptions } from '@/data/emotions';

describe('EmotionTracker Component', () => {
  const mockOnMoodChange = jest.fn();

  beforeEach(() => {
    // Reset mock function
    mockOnMoodChange.mockReset();
  });

  it('renders with default props correctly', () => {
    render(<EmotionTracker currentMood={null} onMoodChange={mockOnMoodChange} />);
    
    // Should display the prompt text
    expect(screen.getByText('How are you feeling?')).toBeInTheDocument();
    
    // Should display all emotion options
    emotionOptions.forEach(emotion => {
      const button = screen.getByTitle(emotion.label);
      expect(button).toBeInTheDocument();
      expect(button.textContent).toContain(emotion.emoji);
    });
  });

  it('renders with a selected mood correctly', () => {
    const selectedEmotion = emotionOptions[0]; // 'excited'
    
    render(
      <EmotionTracker 
        currentMood={selectedEmotion.value} 
        onMoodChange={mockOnMoodChange} 
      />
    );
    
    // Should display the selected emotion label
    expect(screen.getByText(selectedEmotion.label)).toBeInTheDocument();
    expect(screen.getByText(selectedEmotion.emoji, { exact: false })).toBeInTheDocument();
  });

  it('calls onMoodChange when an emotion is selected', () => {
    render(<EmotionTracker currentMood={null} onMoodChange={mockOnMoodChange} />);
    
    // Click on the first emotion
    const emotion = emotionOptions[0];
    fireEvent.click(screen.getByTitle(emotion.label));
    
    // Should call onMoodChange with the selected emotion
    expect(mockOnMoodChange).toHaveBeenCalledWith(emotion.value);
  });

  it('expands the emotion details panel when "See details" is clicked', async () => {
    render(<EmotionTracker currentMood={null} onMoodChange={mockOnMoodChange} />);
    
    // Click on the "See details" button
    fireEvent.click(screen.getByTitle('See details'));
    
    // Should display the expanded view
    await waitFor(() => {
      expect(screen.getByText('Your Emotional State')).toBeInTheDocument();
      expect(screen.getByText('Tracking your emotions helps you understand your productivity patterns and mental wellbeing.')).toBeInTheDocument();
    });
  });

  it('selects an emotion from the expanded panel', async () => {
    render(<EmotionTracker currentMood={null} onMoodChange={mockOnMoodChange} />);
    
    // Open the expanded panel
    fireEvent.click(screen.getByTitle('See details'));
    
    // Wait for panel to appear
    await waitFor(() => {
      expect(screen.getByText('Your Emotional State')).toBeInTheDocument();
    });
    
    // Select "Confident" emotion from the expanded panel
    fireEvent.click(screen.getByText('Confident'));
    
    // Should call onMoodChange with the correct value
    expect(mockOnMoodChange).toHaveBeenCalledWith('confident');
  });

  it('renders without label when showLabel is false', () => {
    render(
      <EmotionTracker 
        currentMood={null} 
        onMoodChange={mockOnMoodChange}
        showLabel={false}
      />
    );
    
    // Should not display the prompt text
    expect(screen.queryByText('How are you feeling?')).not.toBeInTheDocument();
  });

  it('applies custom className correctly', () => {
    const { container } = render(
      <EmotionTracker 
        currentMood={null} 
        onMoodChange={mockOnMoodChange}
        className="custom-class"
      />
    );
    
    // The container should have the custom class
    expect(container.firstChild).toHaveClass('custom-class');
  });
}); 