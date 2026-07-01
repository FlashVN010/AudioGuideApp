using AudioGuideApp.Models;

namespace AudioGuideApp.ViewModels;

public sealed class PoiCardViewModel
{
    public PoiCardViewModel(PoiListItem source)
    {
        Source = source;
        ImageSource = !string.IsNullOrWhiteSpace(source.ImageUrl)
            ? Microsoft.Maui.Controls.ImageSource.FromUri(new Uri(source.ImageUrl))
            : null;
    }

    public PoiListItem Source { get; }
    public int Id => Source.Id;
    public string Name => Source.Name;
    public string Slug => Source.Slug;
    public double Latitude => Source.Latitude;
    public double Longitude => Source.Longitude;
    public string Category => Source.Category;
    public string ShortDescription => Source.ShortDescription;
    public string RatingText => Source.ReviewCount > 0 ? $"{Source.Rating:0.0} ({Source.ReviewCount})" : "Chưa có đánh giá";
    public string DistanceText => Source.DistanceMeters.HasValue ? $"{Source.DistanceMeters.Value / 1000:0.#} km" : "Khám phá";
    public string PriceText => Source.PriceRange switch
    {
        "1" => "Bình dân",
        "2" => "Trung bình",
        "3" => "Khá",
        _ => Source.PriceRange,
    };
    public Microsoft.Maui.Controls.ImageSource? ImageSource { get; }
}

public sealed class TourCardViewModel
{
    public TourCardViewModel(TourListItem source)
    {
        Source = source;
    }

    public TourListItem Source { get; }
    public int Id => Source.Id;
    public string Name => Source.Name;
    public string Description => Source.Description;
    public string DurationText => $"{Source.EstimatedMinutes} phút";
    public string DistanceText => $"{Source.DistanceKm:0.#} km";
    public string StopCountText => $"{Source.StopCount} điểm dừng";
}
