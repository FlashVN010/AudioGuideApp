using System.Collections.ObjectModel;
using System.ComponentModel;
using System.Runtime.CompilerServices;
using AudioGuideApp.Models;
using AudioGuideApp.Services;
using AudioGuideApp.ViewModels;
using Microsoft.Maui.Controls.Maps;
using Microsoft.Maui.Maps;

namespace AudioGuideApp;

public partial class MainPage : ContentPage
{
    private readonly AudioGuideApiClient _apiClient = new();
    private readonly ObservableCollection<PoiCardViewModel> _poiCards = [];
    private readonly ObservableCollection<TourCardViewModel> _tourCards = [];
    private readonly List<PoiCardViewModel> _allPoiCards = [];
    private readonly List<TourCardViewModel> _allTourCards = [];
    private readonly HashSet<int> _bookmarks = [];
    private Location? _lastKnownLocation;
    private PoiDetail? _selectedPoi;
    private TourDetail? _selectedTour;
    private bool _isBusy;
    private string _searchText = string.Empty;
    private string _sessionId = string.Empty;
    private bool _isActivated;

    public ObservableCollection<PoiCardViewModel> PoiCards => _poiCards;
    public ObservableCollection<TourCardViewModel> TourCards => _tourCards;

    public bool IsLoading
    {
        get => _isBusy;
        set
        {
            if (_isBusy == value) return;
            _isBusy = value;
            base.OnPropertyChanged();
            LoadingOverlay.IsVisible = value;
        }
    }

    public string SearchText
    {
        get => _searchText;
        set
        {
            if (_searchText == value) return;
            _searchText = value;
            OnPropertyChanged();
            ApplyFilter();
        }
    }

    public MainPage()
    {
        InitializeComponent();
        BindingContext = this;

        PoiCollection.ItemsSource = PoiCards;
        TourCollection.ItemsSource = TourCards;
        TourStopsCollection.ItemsSource = new ObservableCollection<TourStop>();

        PoiDetailCard.IsVisible = false;
        TourDetailCard.IsVisible = false;

        Loaded += async (_, _) => await LoadAsync();
    }

    protected override void OnAppearing()
    {
        base.OnAppearing();
        LoadingOverlay.IsVisible = IsLoading;
    }

    private async Task LoadAsync()
    {
        IsLoading = true;
        LoadingLabel.Text = "Đang nạp dữ liệu backend...";

        try
        {
            _sessionId = Preferences.Get("audio_guide_session_id", string.Empty);
            if (string.IsNullOrWhiteSpace(_sessionId))
            {
                _sessionId = Guid.NewGuid().ToString("N");
                Preferences.Set("audio_guide_session_id", _sessionId);
            }

            await EnsureLocationAsync();

            var poiTask = _apiClient.GetPoisAsync(lang: "vi");
            var tourTask = _apiClient.GetToursAsync(lang: "vi");
            var statusTask = _apiClient.GetVisitorStatusAsync(_sessionId);

            await Task.WhenAll(poiTask, tourTask, statusTask);

            var pois = (await poiTask ?? []).Select(p => new PoiCardViewModel(p)).ToList();
            var tours = (await tourTask ?? []).Select(t => new TourCardViewModel(t)).ToList();
            var status = await statusTask;

            _allPoiCards.Clear();
            _allPoiCards.AddRange(pois);
            _allTourCards.Clear();
            _allTourCards.AddRange(tours);
            _bookmarks.Clear();

            if (status != null)
            {
                _isActivated = status.IsActivated;
                foreach (var bookmark in status.Bookmarks)
                {
                    _bookmarks.Add(bookmark);
                }
                ActivationStatusLabel.Text = status.IsActivated
                    ? $"Kích hoạt đến {FormatActivationExpiry(status.ExpiresAt)}"
                    : "Chưa kích hoạt";
                ActivationStatusLabel.TextColor = status.IsActivated ? Colors.LightGreen : Colors.White;
            }
            else
            {
                ActivationStatusLabel.Text = "Chưa kích hoạt";
                _isActivated = false;
            }

            PoiCountLabel.Text = pois.Count.ToString();
            TourCountLabel.Text = tours.Count.ToString();
            QrCountLabel.Text = pois.Sum(p => p.Source.ReviewCount).ToString();
            ActiveVisitorsLabel.Text = _isActivated ? "1" : "0";
            BackendStatusLabel.Text = _apiClient.BaseAddress.Replace("http://", string.Empty).Replace("https://", string.Empty);
            MapHintLabel.Text = _apiClient.BaseAddress.Contains("10.0.2.2", StringComparison.OrdinalIgnoreCase)
                ? "Kết nối backend Android emulator"
                : "Kết nối backend localhost";

            ApplyFilter();

            var nearest = FindNearestPoi();
            NearestPoiLabel.Text = nearest != null
                ? $"Gần nhất: {nearest.Name} · {nearest.DistanceText}"
                : "Đang xác định điểm gần nhất...";

            if (_lastKnownLocation != null)
            {
                PoiMap.MoveToRegion(MapSpan.FromCenterAndRadius(_lastKnownLocation, Distance.FromKilometers(1.6)));
            }
            else if (_allPoiCards.Count > 0)
            {
                PoiMap.MoveToRegion(MapSpan.FromCenterAndRadius(new Location(_allPoiCards[0].Latitude, _allPoiCards[0].Longitude), Distance.FromKilometers(1.2)));
            }
        }
        catch (Exception ex)
        {
            BackendStatusLabel.Text = "Lỗi kết nối";
            ActivationStatusLabel.Text = "Không tải được dữ liệu";
            MapHintLabel.Text = ex.Message;
            await DisplayAlert("AudioGuideApp", $"Không tải được dữ liệu backend.\n{ex.Message}", "Đóng");
        }
        finally
        {
            IsLoading = false;
        }
    }

    private async Task EnsureLocationAsync()
    {
        try
        {
            var status = await Permissions.CheckStatusAsync<Permissions.LocationWhenInUse>();
            if (status != PermissionStatus.Granted)
            {
                status = await Permissions.RequestAsync<Permissions.LocationWhenInUse>();
            }

            if (status == PermissionStatus.Granted)
            {
                var location = await Geolocation.GetLocationAsync(new GeolocationRequest(GeolocationAccuracy.Medium, TimeSpan.FromSeconds(8)));
                if (location != null)
                {
                    _lastKnownLocation = new Location(location.Latitude, location.Longitude);
                }
            }
        }
        catch
        {
            _lastKnownLocation = null;
        }
    }

    private void ApplyFilter()
    {
        var query = SearchText.Trim();

        var filteredPois = string.IsNullOrWhiteSpace(query)
            ? _allPoiCards
            : _allPoiCards.Where(p =>
                p.Name.Contains(query, StringComparison.OrdinalIgnoreCase) ||
                p.Category.Contains(query, StringComparison.OrdinalIgnoreCase) ||
                p.ShortDescription.Contains(query, StringComparison.OrdinalIgnoreCase) ||
                p.DistanceText.Contains(query, StringComparison.OrdinalIgnoreCase)).ToList();

        var filteredTours = string.IsNullOrWhiteSpace(query)
            ? _allTourCards
            : _allTourCards.Where(t =>
                t.Name.Contains(query, StringComparison.OrdinalIgnoreCase) ||
                t.Description.Contains(query, StringComparison.OrdinalIgnoreCase)).ToList();

        PoiCards.Clear();
        foreach (var card in filteredPois)
        {
            PoiCards.Add(card);
        }

        TourCards.Clear();
        foreach (var card in filteredTours)
        {
            TourCards.Add(card);
        }

        PoiCountSubtitleLabel.Text = $"{PoiCards.Count} kết quả";
        TourCountSubtitleLabel.Text = $"{TourCards.Count} kết quả";

        RefreshMapPins(filteredPois);
    }

    private void RefreshMapPins(IEnumerable<PoiCardViewModel> pois)
    {
        PoiMap.Pins.Clear();

        foreach (var poi in pois.Take(24))
        {
            PoiMap.Pins.Add(new Pin
            {
                Label = poi.Name,
                Address = poi.Category,
                Location = new Location(poi.Latitude, poi.Longitude),
                Type = PinType.Place,
            });
        }
    }

    private PoiCardViewModel? FindNearestPoi()
    {
        if (_lastKnownLocation == null || _allPoiCards.Count == 0)
        {
            return _allPoiCards.FirstOrDefault();
        }

        return _allPoiCards
            .OrderBy(p => GetDistanceMeters(_lastKnownLocation.Latitude, _lastKnownLocation.Longitude, p.Latitude, p.Longitude))
            .FirstOrDefault();
    }

    private async Task ShowPoiDetailAsync(PoiCardViewModel card)
    {
        IsLoading = true;
        LoadingLabel.Text = "Đang tải chi tiết POI...";

        try
        {
            var detail = await _apiClient.GetPoiBySlugAsync(card.Slug, "vi") ?? new PoiDetail
            {
                Id = card.Id,
                Name = card.Name,
                Slug = card.Slug,
                Latitude = card.Latitude,
                Longitude = card.Longitude,
                Category = card.Category,
                ShortDescription = card.ShortDescription,
                FullDescription = card.ShortDescription,
                ImageUrl = card.Source.ImageUrl,
                PriceRange = card.Source.PriceRange,
            };

            _selectedPoi = detail;
            _selectedTour = null;

            PoiDetailCard.IsVisible = true;
            TourDetailCard.IsVisible = false;
            PoiTitleLabel.Text = detail.Name;
            PoiCategoryLabel.Text = detail.Category;
            PoiMetaLabel.Text = BuildPoiMeta(detail);
            PoiDescriptionLabel.Text = string.IsNullOrWhiteSpace(detail.FullDescription) ? detail.ShortDescription : detail.FullDescription;
            PoiImage.Source = BuildImageSource(detail.ImageUrl ?? detail.Images.FirstOrDefault(i => i.IsCover)?.ImageUrl);
            BookmarkButton.Text = _bookmarks.Contains(detail.Id) ? "Bỏ lưu" : "Lưu";

            if (_lastKnownLocation != null)
            {
                var distance = GetDistanceMeters(_lastKnownLocation.Latitude, _lastKnownLocation.Longitude, detail.Latitude, detail.Longitude);
                MapHintLabel.Text = $"{detail.Name} · {distance / 1000:0.#} km từ vị trí hiện tại";
            }

            PoiMap.MoveToRegion(MapSpan.FromCenterAndRadius(new Location(detail.Latitude, detail.Longitude), Distance.FromKilometers(0.8)));
            await _apiClient.LogVisitAsync(new VisitCreateRequest
            {
                PoiId = detail.Id,
                TriggerType = "manual",
                LanguageCode = "vi",
                SessionId = _sessionId,
            });
        }
        catch (Exception ex)
        {
            await DisplayAlert("AudioGuideApp", $"Không tải được chi tiết POI.\n{ex.Message}", "Đóng");
        }
        finally
        {
            IsLoading = false;
        }
    }

    private async Task ShowTourDetailAsync(TourCardViewModel card)
    {
        IsLoading = true;
        LoadingLabel.Text = "Đang tải chi tiết tour...";

        try
        {
            var detail = await _apiClient.GetTourByIdAsync(card.Id, "vi") ?? new TourDetail
            {
                Id = card.Id,
                Name = card.Name,
                Description = card.Description,
                EstimatedMinutes = 0,
                DistanceKm = 0,
                IsActive = true,
            };

            _selectedTour = detail;
            _selectedPoi = null;

            TourDetailCard.IsVisible = true;
            PoiDetailCard.IsVisible = false;
            TourTitleLabel.Text = detail.Name;
            TourMetaLabel.Text = $"{detail.EstimatedMinutes} phút · {detail.DistanceKm:0.#} km · {detail.Stops.Count} điểm dừng";
            TourDescriptionLabel.Text = detail.Description;
            TourStopsCollection.ItemsSource = detail.Stops.OrderBy(s => s.StopOrder).ToList();

            if (detail.Stops.Count > 0)
            {
                var first = detail.Stops.OrderBy(s => s.StopOrder).First();
                PoiMap.MoveToRegion(MapSpan.FromCenterAndRadius(new Location(first.Latitude, first.Longitude), Distance.FromKilometers(1)));
            }
        }
        catch (Exception ex)
        {
            await DisplayAlert("AudioGuideApp", $"Không tải được chi tiết tour.\n{ex.Message}", "Đóng");
        }
        finally
        {
            IsLoading = false;
        }
    }

    private static string BuildPoiMeta(PoiDetail detail)
    {
        var parts = new List<string>();
        if (!string.IsNullOrWhiteSpace(detail.Address)) parts.Add(detail.Address);
        if (detail.DistanceMeters.HasValue) parts.Add($"{detail.DistanceMeters.Value / 1000:0.#} km");
        parts.Add($"⭐ {detail.Rating:0.0} · {detail.ReviewCount} đánh giá");
        if (!string.IsNullOrWhiteSpace(detail.PriceRange)) parts.Add($"Mức giá {detail.PriceRange}");
        return string.Join(" · ", parts);
    }

    private static ImageSource? BuildImageSource(string? url)
    {
        return string.IsNullOrWhiteSpace(url) ? null : ImageSource.FromUri(new Uri(url));
    }

    private async void OnRefreshClicked(object sender, EventArgs e)
    {
        await LoadAsync();
    }

    private async void OnActivateClicked(object sender, EventArgs e)
    {
        await ActivateSessionAsync();
    }

    private void OnSearchTextChanged(object sender, TextChangedEventArgs e)
    {
        SearchText = e.NewTextValue ?? string.Empty;
    }

    private async void OnPoiSelectionChanged(object sender, SelectionChangedEventArgs e)
    {
        if (e.CurrentSelection.FirstOrDefault() is PoiCardViewModel card)
        {
            await ShowPoiDetailAsync(card);
        }

        if (sender is CollectionView collectionView)
        {
            collectionView.SelectedItem = null;
        }
    }

    private async void OnTourSelectionChanged(object sender, SelectionChangedEventArgs e)
    {
        if (e.CurrentSelection.FirstOrDefault() is TourCardViewModel card)
        {
            await ShowTourDetailAsync(card);
        }

        if (sender is CollectionView collectionView)
        {
            collectionView.SelectedItem = null;
        }
    }

    private async void OnBookmarkClicked(object sender, EventArgs e)
    {
        if (_selectedPoi == null) return;

        var request = new BookmarkRequest
        {
            SessionId = _sessionId,
            PoiId = _selectedPoi.Id,
        };

        var bookmarked = _bookmarks.Contains(_selectedPoi.Id);
        var success = bookmarked
            ? await _apiClient.RemoveBookmarkAsync(request)
            : await _apiClient.BookmarkAsync(request);

        if (success)
        {
            if (bookmarked)
            {
                _bookmarks.Remove(_selectedPoi.Id);
                BookmarkButton.Text = "Lưu";
            }
            else
            {
                _bookmarks.Add(_selectedPoi.Id);
                BookmarkButton.Text = "Bỏ lưu";
            }
        }
    }

    private async void OnOpenMapClicked(object sender, EventArgs e)
    {
        if (_selectedPoi == null) return;

        var uri = !string.IsNullOrWhiteSpace(_selectedPoi.GoogleMapsUrl)
            ? _selectedPoi.GoogleMapsUrl
            : $"https://www.google.com/maps/search/?api=1&query={_selectedPoi.Latitude.ToString(System.Globalization.CultureInfo.InvariantCulture)},{_selectedPoi.Longitude.ToString(System.Globalization.CultureInfo.InvariantCulture)}";

        await Launcher.Default.OpenAsync(new Uri(uri));
    }

    private async Task ActivateSessionAsync()
    {
        var cardNumber = await DisplayPromptAsync("Kích hoạt", "Nhập số thẻ test (bắt đầu bằng 4242):", "Kích hoạt", "Hủy", "4242424242424242", -1, Keyboard.Numeric);
        if (string.IsNullOrWhiteSpace(cardNumber)) return;

        var holder = await DisplayPromptAsync("Kích hoạt", "Tên chủ thẻ:", "Tiếp tục", "Hủy", "Audio Guide Demo", -1, Keyboard.Text);
        if (string.IsNullOrWhiteSpace(holder)) return;

        try
        {
            IsLoading = true;
            var response = await _apiClient.ActivateAsync(new ActivateRequest
            {
                SessionId = _sessionId,
                CardNumber = cardNumber.Replace(" ", string.Empty),
                CardHolder = holder,
                LanguageCode = "vi",
            });

            _isActivated = true;
            ActivationStatusLabel.Text = response?.ExpiresAt != null
                ? $"Kích hoạt đến {FormatActivationExpiry(response.ExpiresAt)}"
                : "Đã kích hoạt";
            ActivationStatusLabel.TextColor = Colors.LightGreen;
            ActiveVisitorsLabel.Text = "1";

            await DisplayAlert("AudioGuideApp", response?.Message ?? "Kích hoạt thành công", "OK");
        }
        catch (Exception ex)
        {
            await DisplayAlert("AudioGuideApp", $"Kích hoạt thất bại.\n{ex.Message}", "Đóng");
        }
        finally
        {
            IsLoading = false;
        }
    }

    private static string FormatActivationExpiry(string? expiresAt)
    {
        if (string.IsNullOrWhiteSpace(expiresAt)) return "24h";

        if (DateTime.TryParse(expiresAt, out var parsed))
        {
            return parsed.ToString("dd/MM HH:mm");
        }

        return expiresAt;
    }

    private static double GetDistanceMeters(double lat1, double lon1, double lat2, double lon2)
    {
        const double earthRadius = 6371000;
        var dLat = DegreesToRadians(lat2 - lat1);
        var dLon = DegreesToRadians(lon2 - lon1);

        var a = Math.Sin(dLat / 2) * Math.Sin(dLat / 2) +
                Math.Cos(DegreesToRadians(lat1)) * Math.Cos(DegreesToRadians(lat2)) *
                Math.Sin(dLon / 2) * Math.Sin(dLon / 2);
        var c = 2 * Math.Atan2(Math.Sqrt(a), Math.Sqrt(1 - a));
        return earthRadius * c;
    }

    private static double DegreesToRadians(double degrees) => degrees * Math.PI / 180;

}
