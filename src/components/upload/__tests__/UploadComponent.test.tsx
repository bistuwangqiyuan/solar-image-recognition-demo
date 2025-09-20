import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { UploadComponent } from '@/components/upload/UploadComponent';

// Mock react-dropzone
vi.mock('react-dropzone', () => ({
  useDropzone: vi.fn(() => ({
    getRootProps: vi.fn(() => ({
      onClick: vi.fn(),
      onDragOver: vi.fn(),
      onDragLeave: vi.fn(),
      onDrop: vi.fn(),
    })),
    getInputProps: vi.fn(() => ({
      onChange: vi.fn(),
      onClick: vi.fn(),
    })),
    isDragActive: false,
    isDragReject: false,
  })),
}));

describe('UploadComponent', () => {
  const mockOnUpload = vi.fn();
  const mockOnError = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render upload component', () => {
    render(
      <UploadComponent
        onUpload={mockOnUpload}
        onError={mockOnError}
      />
    );

    expect(screen.getByText('拖拽文件到此处')).toBeInTheDocument();
    expect(screen.getByText('或者 点击选择文件')).toBeInTheDocument();
    expect(screen.getByText('支持 JPG、PNG、WEBP 格式')).toBeInTheDocument();
    expect(screen.getByText('最大文件大小：10MB')).toBeInTheDocument();
  });

  it('should show drag active state', () => {
    const { useDropzone } = require('react-dropzone');
    useDropzone.mockReturnValue({
      getRootProps: vi.fn(() => ({})),
      getInputProps: vi.fn(() => ({})),
      isDragActive: true,
      isDragReject: false,
    });

    render(
      <UploadComponent
        onUpload={mockOnUpload}
        onError={mockOnError}
      />
    );

    expect(screen.getByText('释放文件开始上传')).toBeInTheDocument();
  });

  it('should show drag reject state', () => {
    const { useDropzone } = require('react-dropzone');
    useDropzone.mockReturnValue({
      getRootProps: vi.fn(() => ({})),
      getInputProps: vi.fn(() => ({})),
      isDragActive: false,
      isDragReject: true,
    });

    render(
      <UploadComponent
        onUpload={mockOnUpload}
        onError={mockOnError}
      />
    );

    expect(screen.getByText('文件格式不支持')).toBeInTheDocument();
    expect(screen.getByText('请选择JPG、PNG或WEBP格式的图片文件')).toBeInTheDocument();
  });

  it('should be disabled when disabled prop is true', () => {
    const { useDropzone } = require('react-dropzone');
    const mockGetRootProps = vi.fn(() => ({}));
    useDropzone.mockReturnValue({
      getRootProps: mockGetRootProps,
      getInputProps: vi.fn(() => ({})),
      isDragActive: false,
      isDragReject: false,
    });

    render(
      <UploadComponent
        onUpload={mockOnUpload}
        onError={mockOnError}
        disabled={true}
      />
    );

    expect(mockGetRootProps).toHaveBeenCalledWith(
      expect.objectContaining({
        disabled: true,
      })
    );
  });

  it('should call onUpload when file is accepted', () => {
    const mockFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
    const { useDropzone } = require('react-dropzone');
    
    let onDropCallback: (files: File[], rejectedFiles: any[]) => void;
    useDropzone.mockImplementation(({ onDrop }: any) => {
      onDropCallback = onDrop;
      return {
        getRootProps: vi.fn(() => ({})),
        getInputProps: vi.fn(() => ({})),
        isDragActive: false,
        isDragReject: false,
      };
    });

    render(
      <UploadComponent
        onUpload={mockOnUpload}
        onError={mockOnError}
      />
    );

    // Simulate file drop
    onDropCallback([mockFile], []);

    expect(mockOnUpload).toHaveBeenCalledWith(mockFile);
  });

  it('should call onError when file is rejected', () => {
    const { useDropzone } = require('react-dropzone');
    
    let onDropCallback: (files: File[], rejectedFiles: any[]) => void;
    useDropzone.mockImplementation(({ onDrop }: any) => {
      onDropCallback = onDrop;
      return {
        getRootProps: vi.fn(() => ({})),
        getInputProps: vi.fn(() => ({})),
        isDragActive: false,
        isDragReject: false,
      };
    });

    render(
      <UploadComponent
        onUpload={mockOnUpload}
        onError={mockOnError}
      />
    );

    // Simulate file rejection
    const rejectedFiles = [{
      errors: [{ code: 'file-too-large' }],
    }];
    onDropCallback([], rejectedFiles);

    expect(mockOnError).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'FILE_TOO_LARGE',
        message: expect.stringContaining('文件大小超过限制'),
        retryable: false,
      })
    );
  });

  it('should handle unsupported file format error', () => {
    const { useDropzone } = require('react-dropzone');
    
    let onDropCallback: (files: File[], rejectedFiles: any[]) => void;
    useDropzone.mockImplementation(({ onDrop }: any) => {
      onDropCallback = onDrop;
      return {
        getRootProps: vi.fn(() => ({})),
        getInputProps: vi.fn(() => ({})),
        isDragActive: false,
        isDragReject: false,
      };
    });

    render(
      <UploadComponent
        onUpload={mockOnUpload}
        onError={mockOnError}
      />
    );

    // Simulate unsupported format
    const rejectedFiles = [{
      errors: [{ code: 'file-invalid-type' }],
    }];
    onDropCallback([], rejectedFiles);

    expect(mockOnError).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'UNSUPPORTED_FORMAT',
        message: expect.stringContaining('不支持的文件格式'),
        retryable: false,
      })
    );
  });

  it('should use custom max size', () => {
    const { useDropzone } = require('react-dropzone');
    const mockUseDropzone = vi.fn();
    useDropzone.mockImplementation(mockUseDropzone);

    render(
      <UploadComponent
        onUpload={mockOnUpload}
        onError={mockOnError}
        maxSize={5 * 1024 * 1024} // 5MB
      />
    );

    expect(mockUseDropzone).toHaveBeenCalledWith(
      expect.objectContaining({
        maxSize: 5 * 1024 * 1024,
      })
    );
  });

  it('should use custom accepted types', () => {
    const { useDropzone } = require('react-dropzone');
    const mockUseDropzone = vi.fn();
    useDropzone.mockImplementation(mockUseDropzone);

    const customTypes = ['image/jpeg', 'image/png'];
    render(
      <UploadComponent
        onUpload={mockOnUpload}
        onError={mockOnError}
        acceptedTypes={customTypes}
      />
    );

    expect(mockUseDropzone).toHaveBeenCalledWith(
      expect.objectContaining({
        accept: {
          'image/*': ['.jpeg', '.jpg', '.png', '.webp'],
        },
      })
    );
  });
});
