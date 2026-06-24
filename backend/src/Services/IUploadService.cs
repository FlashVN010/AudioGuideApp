using src.Models.DTOs;

namespace src.Services
{
    public interface IUploadService
    {
        Task<UploadResultDto> UploadImageAsync(IFormFile file, string subfolder);
        Task<UploadResultDto> UploadAudioAsync(IFormFile file);
        Task DeleteFileAsync(string filePath);
    }
}
