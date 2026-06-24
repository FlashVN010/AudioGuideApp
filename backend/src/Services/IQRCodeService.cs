using System.Threading.Tasks;
using src.Models.DTOs;

namespace src.Services
{
    public interface IQRCodeService
    {
        Task<QRCodeDto?> GetByCodeAsync(string code);
        Task<QRCodeDto> GenerateQRCodeAsync(int poiId);
        Task<bool> DeleteQRCodeAsync(int id);
    }
}
