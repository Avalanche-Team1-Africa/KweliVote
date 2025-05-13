@require_GET
def biometric_health_check(request):
    """
    Specific health check for biometric processing capabilities.
    Checks if all required components for fingerprint template fusion are available and working.
    """
    biometric_enabled = os.environ.get('BIOMETRIC_FUSION_ENABLED', 'False').lower() == 'true'
    
    if not biometric_enabled:
        return JsonResponse({
            'status': 'disabled',
            'message': 'Biometric processing is disabled in configuration'
        }, status=200)
    
    # Check dependencies
    dependencies_status = "available" if BIOMETRIC_IMPORTS_SUCCESSFUL else "missing"
    
    # Check temp storage
    temp_dir = os.environ.get('BIOMETRIC_TEMP_STORAGE', '/tmp')
    storage_status = "available"
    storage_error = None
    
    try:
        # Test write access to temp directory
        test_file = os.path.join(temp_dir, 'biometric_test.tmp')
        with open(test_file, 'w') as f:
            f.write('test')
        os.remove(test_file)
    except Exception as e:
        storage_status = "error"
        storage_error = str(e)
    
    # Test a minimal template fusion operation
    fusion_status = "untested"
    fusion_error = None
    
    if BIOMETRIC_IMPORTS_SUCCESSFUL and storage_status == "available":
        try:
            # Create test minutiae points
            test_points1 = np.array([[100, 100, 45], [150, 150, 90], [200, 100, 135]])
            test_points2 = np.array([[102, 103, 48], [148, 152, 92], [205, 98, 130]])
            
            # Combine points
            all_points = np.vstack([test_points1, test_points2])
            xy_coords = all_points[:, :2]
            
            # Apply DBSCAN clustering
            eps = int(os.environ.get('TEMPLATE_FUSION_EPS', '12'))
            min_samples = int(os.environ.get('TEMPLATE_FUSION_MIN_SAMPLES', '2'))
            clustering = DBSCAN(eps=eps, min_samples=min_samples).fit(xy_coords)
            
            # Check results
            if clustering.labels_.max() >= 0:  # At least one cluster was found
                fusion_status = "working"
            else:
                fusion_status = "configuration_error"
                fusion_error = "DBSCAN clustering did not find any clusters"
        except Exception as e:
            fusion_status = "error"
            fusion_error = str(e)
    
    # Verify processing performance
    performance = {
        "system_info": {
            "platform": sys.platform,
            "python_version": sys.version,
            "cpu_cores": os.cpu_count(),
        }
    }
    
    response_data = {
        'status': 'healthy' if (dependencies_status == 'available' and 
                              storage_status == 'available' and 
                              fusion_status == 'working') else 'unhealthy',
        'timestamp': datetime.datetime.now().isoformat(),
        'environment': 'production' if not settings.DEBUG else 'development',
        'biometric_processing': {
            'enabled': biometric_enabled,
            'dependencies': {
                'status': dependencies_status,
                'numpy_version': np.__version__ if BIOMETRIC_IMPORTS_SUCCESSFUL else None,
                'sklearn_version': sklearn.__version__ if BIOMETRIC_IMPORTS_SUCCESSFUL else None,
            },
            'storage': {
                'status': storage_status,
                'path': temp_dir,
                'error': storage_error,
            },
            'template_fusion': {
                'status': fusion_status,
                'parameters': {
                    'eps': os.environ.get('TEMPLATE_FUSION_EPS', '12'),
                    'min_samples': os.environ.get('TEMPLATE_FUSION_MIN_SAMPLES', '2'),
                },
                'error': fusion_error,
            },
            'performance': performance
        }
    }
    
    status_code = 200 if response_data['status'] == 'healthy' else 500
    return JsonResponse(response_data, status=status_code)
