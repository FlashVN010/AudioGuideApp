using src.Models.DTOs;

namespace src.Services
{
    public interface IAudioProgressService
    {
        Task<AudioProgressDto?> GetProgressAsync(int userId, int audioFileId);
        Task<AudioProgressDto> SaveProgressAsync(int userId, SaveAudioProgressDto dto);
    }
}
