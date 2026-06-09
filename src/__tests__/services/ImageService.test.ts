import { Directory, File } from 'expo-file-system';
import * as ImageManipulator from 'expo-image-manipulator';
import ImageService from '../../services/ImageService';

const IMAGES_DIR = 'file:///tmp/documents/images/';

const mockFile = File as unknown as jest.Mock;
const mockDirectory = Directory as unknown as jest.Mock;
const mockManipulate = ImageManipulator.manipulateAsync as jest.Mock;

describe('ImageService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('saveImage', () => {
    it('should return the same URI if the image is already in the images dir', async () => {
      const uri = `${IMAGES_DIR}image_123_abc.jpg`;

      const result = await ImageService.saveImage(uri);

      expect(result).toBe(uri);
      expect(mockManipulate).not.toHaveBeenCalled();
      expect(mockFile).not.toHaveBeenCalled();
    });

    it('should compress and copy a new image into the images dir', async () => {
      const tempUri = 'file:///tmp/cache/photo.jpg';

      const result = await ImageService.saveImage(tempUri);

      expect(mockManipulate).toHaveBeenCalledWith(
        tempUri,
        [{ resize: { width: 1200, height: 1200 } }],
        expect.objectContaining({ compress: 0.8 })
      );
      expect(result).toMatch(
        new RegExp(`^${IMAGES_DIR}image_\\d+_[a-z0-9]+\\.jpg$`)
      );
      // Source file copied to destination
      const sourceFile = mockFile.mock.results[0].value;
      expect(sourceFile.copy).toHaveBeenCalled();
    });

    it('should fall back to the original URI if compression fails', async () => {
      const tempUri = 'file:///tmp/cache/photo.jpg';
      mockManipulate.mockRejectedValueOnce(new Error('manipulation failed'));

      const result = await ImageService.saveImage(tempUri);

      expect(result).toMatch(new RegExp(`^${IMAGES_DIR}image_`));
      expect(mockFile).toHaveBeenCalledWith(tempUri);
    });

    it('should return null if copying the file fails', async () => {
      mockFile.mockImplementationOnce(() => ({
        exists: true,
        copy: jest.fn().mockRejectedValue(new Error('copy failed')),
        delete: jest.fn(),
      }));

      const result = await ImageService.saveImage('file:///tmp/cache/x.jpg');

      expect(result).toBeNull();
    });
  });

  describe('deleteImage', () => {
    it('should ignore non-local URIs', async () => {
      await ImageService.deleteImage('https://example.com/image.jpg');
      await ImageService.deleteImage('content://media/external/images/1');

      expect(mockFile).not.toHaveBeenCalled();
    });

    it('should delete an existing local image', async () => {
      const uri = `${IMAGES_DIR}image_123_abc.jpg`;

      await ImageService.deleteImage(uri);

      expect(mockFile).toHaveBeenCalledWith(uri);
      const file = mockFile.mock.results[0].value;
      expect(file.delete).toHaveBeenCalled();
    });

    it('should not delete if the file does not exist', async () => {
      mockFile.mockImplementationOnce(() => ({
        exists: false,
        copy: jest.fn(),
        delete: jest.fn(),
      }));

      await ImageService.deleteImage('file:///tmp/documents/images/gone.jpg');

      const file = mockFile.mock.results[0].value;
      expect(file.delete).not.toHaveBeenCalled();
    });

    it('should not throw if deletion fails', async () => {
      mockFile.mockImplementationOnce(() => ({
        exists: true,
        copy: jest.fn(),
        delete: jest.fn().mockRejectedValue(new Error('delete failed')),
      }));

      await expect(
        ImageService.deleteImage('file:///tmp/documents/images/x.jpg')
      ).resolves.toBeUndefined();
    });
  });

  describe('clearAllImages', () => {
    it('should delete the images directory and recreate it', async () => {
      await ImageService.clearAllImages();

      expect(mockDirectory).toHaveBeenCalledWith(IMAGES_DIR);
      const dir = mockDirectory.mock.results[0].value;
      expect(dir.delete).toHaveBeenCalled();
    });

    it('should not throw if cleanup fails', async () => {
      mockDirectory.mockImplementationOnce(() => ({
        exists: true,
        create: jest.fn(),
        delete: jest.fn().mockRejectedValue(new Error('rmdir failed')),
      }));

      await expect(ImageService.clearAllImages()).resolves.toBeUndefined();
    });
  });
});
