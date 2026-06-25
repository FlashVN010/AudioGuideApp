using System.Threading.Tasks;

namespace src.Services
{
    public interface ITTSService
    {
        Task<string> GenerateAudioAsync(string text, string languageCode, int poiId);
    }
}
