using System.Text.Json.Serialization;

namespace AudioGuideApp.Models;

public sealed class PoiListItem
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Slug { get; set; } = string.Empty;
    public double Latitude { get; set; }
    public double Longitude { get; set; }
    public string Category { get; set; } = string.Empty;
    public string? ImageUrl { get; set; }
    public string ShortDescription { get; set; } = string.Empty;
    public double? DistanceMeters { get; set; }
    public int? OwnerId { get; set; }
    public string ApprovalStatus { get; set; } = string.Empty;
    public bool IsFavorite { get; set; }
    public double Rating { get; set; }
    public int ReviewCount { get; set; }
    public string PriceRange { get; set; } = string.Empty;
}

public sealed class PoiImage
{
    public int Id { get; set; }
    public string ImageUrl { get; set; } = string.Empty;
    public bool IsCover { get; set; }
}

public sealed class PoiDetail
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Slug { get; set; } = string.Empty;
    public double Latitude { get; set; }
    public double Longitude { get; set; }
    public int TriggerRadiusMeters { get; set; }
    public string Category { get; set; } = string.Empty;
    public int Priority { get; set; }
    public string ApprovalStatus { get; set; } = string.Empty;
    public string? Address { get; set; }
    public string? Ward { get; set; }
    public string? District { get; set; }
    public string? City { get; set; }
    public string? Phone { get; set; }
    public string? Website { get; set; }
    public string? FacebookUrl { get; set; }
    public string? ImageUrl { get; set; }
    public string? GoogleMapsUrl { get; set; }
    public bool IsActive { get; set; }
    public double Rating { get; set; }
    public int ReviewCount { get; set; }
    public string LocalizedName { get; set; } = string.Empty;
    public string ShortDescription { get; set; } = string.Empty;
    public string FullDescription { get; set; } = string.Empty;
    public string AudioText { get; set; } = string.Empty;
    public string? LanguageCode { get; set; }
    public string? QrCode { get; set; }
    public int MenuItemCount { get; set; }
    public double? DistanceMeters { get; set; }
    public bool IsFavorite { get; set; }
    public string PriceRange { get; set; } = string.Empty;
    public List<PoiImage> Images { get; set; } = [];
    public string? OperatingHours { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}

public sealed class TourListItem
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public int EstimatedMinutes { get; set; }
    public double DistanceKm { get; set; }
    public int StopCount { get; set; }
}

public sealed class TourStop
{
    public int Id { get; set; }
    public int PoiId { get; set; }
    public string PoiName { get; set; } = string.Empty;
    public string PoiCategory { get; set; } = string.Empty;
    public double Latitude { get; set; }
    public double Longitude { get; set; }
    public int StopOrder { get; set; }
    public string? TransitionNote { get; set; }
    public string PoiShortDescription { get; set; } = string.Empty;
}

public sealed class TourDetail
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public int EstimatedMinutes { get; set; }
    public double DistanceKm { get; set; }
    public bool IsActive { get; set; }
    public List<TourStop> Stops { get; set; } = [];
}

public sealed class AnalyticsSummary
{
    public int TotalVisits { get; set; }
    public int TotalQrScans { get; set; }
    public int TotalAudioPlays { get; set; }
    public int ActiveVisitors { get; set; }
}

public sealed class VisitorStatusResponse
{
    public string SessionId { get; set; } = string.Empty;
    public bool IsActivated { get; set; }
    public string? ExpiresAt { get; set; }
    public List<int> Bookmarks { get; set; } = [];
}

public sealed class ActivateRequest
{
    public string SessionId { get; set; } = string.Empty;
    public string? Code { get; set; }
    public string CardNumber { get; set; } = string.Empty;
    public string CardHolder { get; set; } = string.Empty;
    public string? LanguageCode { get; set; }
}

public sealed class ActivateResponse
{
    public string Message { get; set; } = string.Empty;
    public string? ExpiresAt { get; set; }
    public string? RedirectSlug { get; set; }
}

public sealed class BookmarkRequest
{
    public string SessionId { get; set; } = string.Empty;
    public int PoiId { get; set; }
}

public sealed class VisitCreateRequest
{
    public int PoiId { get; set; }
    public string TriggerType { get; set; } = "manual";
    public string LanguageCode { get; set; } = "vi";
    public string? SessionId { get; set; }
}
