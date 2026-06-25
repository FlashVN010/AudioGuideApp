using System.Threading.Tasks;
using src.Models.DTOs;

namespace src.Services
{
    public interface ITranslationService
    {
        Task<TranslationDto?> GetTranslationAsync(int poiId, string lang);
        Task<TranslationDto> UpsertTranslationAsync(TranslationCreateDto dto);
    }
}
