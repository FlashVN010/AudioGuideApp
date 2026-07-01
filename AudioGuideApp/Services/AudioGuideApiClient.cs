using System.Net.Http.Json;
using System.Text.Json;
using AudioGuideApp.Models;

namespace AudioGuideApp.Services;

public sealed class AudioGuideApiClient
{
    private readonly HttpClient _httpClient;
    private readonly JsonSerializerOptions _jsonOptions = new()
    {
        PropertyNameCaseInsensitive = true,
    };

    public AudioGuideApiClient()
    {
        _httpClient = new HttpClient
        {
            BaseAddress = new Uri(GetBaseAddress(), UriKind.Absolute),
            Timeout = TimeSpan.FromSeconds(20),
        };
    }

    public string BaseAddress => _httpClient.BaseAddress?.ToString() ?? string.Empty;

    private static string GetBaseAddress()
    {
        var configured = Preferences.Get("backend_base_url", string.Empty).Trim();
        if (!string.IsNullOrWhiteSpace(configured))
        {
            return configured.TrimEnd('/');
        }

        if (DeviceInfo.Platform == DevicePlatform.Android)
        {
            return "http://10.0.2.2:5011";
        }

        return "http://localhost:5011";
    }

    public Task<List<PoiListItem>?> GetPoisAsync(string? query = null, string lang = "vi")
    {
        var path = string.IsNullOrWhiteSpace(query)
            ? $"api/pois?lang={Uri.EscapeDataString(lang)}"
            : $"api/pois?q={Uri.EscapeDataString(query)}&lang={Uri.EscapeDataString(lang)}";

        return _httpClient.GetFromJsonAsync<List<PoiListItem>>(path, _jsonOptions);
    }

    public Task<PoiDetail?> GetPoiBySlugAsync(string slug, string lang = "vi")
    {
        return _httpClient.GetFromJsonAsync<PoiDetail>($"api/pois/slug/{Uri.EscapeDataString(slug)}?lang={Uri.EscapeDataString(lang)}", _jsonOptions);
    }

    public Task<List<TourListItem>?> GetToursAsync(string lang = "vi")
    {
        return _httpClient.GetFromJsonAsync<List<TourListItem>>($"api/tours?lang={Uri.EscapeDataString(lang)}", _jsonOptions);
    }

    public Task<TourDetail?> GetTourByIdAsync(int id, string lang = "vi")
    {
        return _httpClient.GetFromJsonAsync<TourDetail>($"api/tours/{id}?lang={Uri.EscapeDataString(lang)}", _jsonOptions);
    }

    public Task<VisitorStatusResponse?> GetVisitorStatusAsync(string sessionId)
    {
        return _httpClient.GetFromJsonAsync<VisitorStatusResponse>($"api/visitor/status?sessionId={Uri.EscapeDataString(sessionId)}", _jsonOptions);
    }

    public async Task<ActivateResponse?> ActivateAsync(ActivateRequest request)
    {
        var response = await _httpClient.PostAsJsonAsync("api/visitor/activate", request);
        response.EnsureSuccessStatusCode();
        return await response.Content.ReadFromJsonAsync<ActivateResponse>(_jsonOptions);
    }

    public async Task<bool> BookmarkAsync(BookmarkRequest request)
    {
        var response = await _httpClient.PostAsJsonAsync("api/visitor/bookmark", request);
        return response.IsSuccessStatusCode;
    }

    public async Task<bool> RemoveBookmarkAsync(BookmarkRequest request)
    {
        var message = new HttpRequestMessage(HttpMethod.Delete, "api/visitor/bookmark")
        {
            Content = JsonContent.Create(request),
        };

        var response = await _httpClient.SendAsync(message);
        return response.IsSuccessStatusCode;
    }

    public async Task<bool> LogVisitAsync(VisitCreateRequest request)
    {
        var response = await _httpClient.PostAsJsonAsync("api/analytics/visit", request);
        return response.IsSuccessStatusCode;
    }
}
