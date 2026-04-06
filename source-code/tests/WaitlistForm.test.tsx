import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { vi, describe, it, expect } from 'vitest'
import WaitlistForm from '@/components/ui/WaitlistForm'
import { supabase } from '@/lib/supabase'

describe('WaitlistForm', () => {
  it('renders correctly', () => {
    render(<WaitlistForm />)
    expect(screen.getByLabelText(/Full Name/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/Email Address/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Join the Waitlist/i })).toBeInTheDocument()
  })

  it('submits correctly', async () => {
    const mockInsert = vi.fn().mockResolvedValue({ data: null, error: null })
    ;(supabase.from as any).mockReturnValue({
      insert: mockInsert,
    })

    render(<WaitlistForm />)
    
    fireEvent.change(screen.getByLabelText(/Full Name/i), { target: { value: 'John Doe' } })
    fireEvent.change(screen.getByLabelText(/Email Address/i), { target: { value: 'john@example.com' } })
    fireEvent.click(screen.getByRole('button', { name: /Join the Waitlist/i }))

    await waitFor(() => {
      expect(mockInsert).toHaveBeenCalledWith([{ name: 'John Doe', email: 'john@example.com' }])
      expect(screen.getByText(/You're on the list!/i)).toBeInTheDocument()
    })
  })

  it('shows error message if submission fails', async () => {
    const mockInsert = vi.fn().mockResolvedValue({ data: null, error: { message: 'Failed' } })
    ;(supabase.from as any).mockReturnValue({
      insert: mockInsert,
    })

    render(<WaitlistForm />)
    
    fireEvent.change(screen.getByLabelText(/Full Name/i), { target: { value: 'John Doe' } })
    fireEvent.change(screen.getByLabelText(/Email Address/i), { target: { value: 'john@example.com' } })
    fireEvent.click(screen.getByRole('button', { name: /Join the Waitlist/i }))

    await waitFor(() => {
      expect(screen.getByText(/Failed/i)).toBeInTheDocument()
    })
  })
})
