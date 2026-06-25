using System.Threading.Tasks;
using src.Models.DTOs;

namespace src.Services
{
    public interface IAnalyticsService
    {
        Task LogVisitAsync(VisitCreateDto dto);
        Task UpdateVisitLanguageAsync(UpdateLanguageDto dto);
        Task<AnalyticsSummaryDto> GetSummaryAsync();
        void RegisterHeartbeat(string sessionId);
    }
}
