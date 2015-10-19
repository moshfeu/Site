﻿module IsraelHiking.Controllers {

    export interface IAddLayerModalScope extends angular.IScope {
        addLayer(name: string, address: string, minZoom: number, maxZoom: number, e: Event): void;
    }

    export interface ILayersScope extends angular.IScope {
        baseLayers: Services.IBaseLayer[];
        overlays: Services.IOvelay[];
        routes: Services.Drawing.IDrawing[];
        markers: Services.Drawing.IDrawing;
        advanced: boolean;
        hovering: boolean;

        addBaseLayer(e: Event): void;
        addOverlay(e: Event): void;
        addRoute(e: Event): void;
        removeBaseLayer(baseLayer: Services.IBaseLayer, e: Event): void;
        removeOverlay(overlay: Services.IOvelay, e: Event): void;
        editRoute(routeName: string, e: Event): void;
        selectBaseLayer(baseLayer: Services.IBaseLayer, e: Event): void;
        toggleVisibility(overlay: Services.IOvelay, e: Event): void;
        selectDrawing(name: string, e: Event): void;
        toggleAdvanced(e: Event): void;
        toggleHovering(e: Event): void;
    }

    export class LayersController extends BaseMapController {
        constructor($scope: ILayersScope,
            $modal,
            mapService: Services.MapService,
            layersService: Services.LayersService,
            fileService: Services.FileService,
            toastr: Toastr) {
            super(mapService);
            $scope.baseLayers = layersService.baseLayers;
            $scope.overlays = layersService.overlays;
            $scope.routes = layersService.routes;
            $scope.markers = layersService.markers;
            $scope.advanced = false;
            $scope.hovering = false;
            var addBaseLayerModal = this.createBaseLayerModal($scope, $modal, layersService);
            var addOverlayModal = this.createOverlayModal($scope, $modal, layersService);

            $scope.addBaseLayer = (e: Event) => {
                addBaseLayerModal.show();
                this.suppressEvents(e);
            }

            $scope.addOverlay = (e: Event) => {
                addOverlayModal.show();
                this.suppressEvents(e);
            }

            $scope.addRoute = (e: Event) => {
                var routePropertiesScope = <IRouteAddScope>$scope.$new();
                var routeAddController = new RouteAddController(routePropertiesScope, mapService, layersService, toastr);
                var modal = this.createRoutePropertiesModal(routePropertiesScope, $modal);
                modal.$promise.then(modal.show);
                this.suppressEvents(e);
            }

            $scope.removeBaseLayer = (baseLayer: Services.IBaseLayer, e: Event) => {
                layersService.removeBaseLayer(baseLayer);
                this.suppressEvents(e);
            }

            $scope.removeOverlay = (overlay: Services.IOvelay, e: Event) => {
                layersService.removeOverlay(overlay);
                this.suppressEvents(e);
            }

            $scope.editRoute = (routeName: string, e: Event) => {
                var routePropertiesScope = <IRouteUpdateScope>$scope.$new();
                var routeUpdateController = new RouteUpdateController(routePropertiesScope, mapService, layersService, fileService, toastr, routeName);
                var modal = this.createRoutePropertiesModal(routePropertiesScope, $modal);
                modal.$promise.then(modal.show);
                this.suppressEvents(e);
            }

            $scope.selectBaseLayer = (baseLayer: Services.IBaseLayer, e: Event) => {
                layersService.selectBaseLayer(baseLayer);
                this.suppressEvents(e);
            }

            $scope.toggleVisibility = (overlay: Services.IOvelay, e: Event) => {
                layersService.toggleOverlay(overlay);
                this.suppressEvents(e);
            }

            $scope.selectDrawing = (name: string, e: Event) => {
                layersService.changeDrawingState(name);
                this.suppressEvents(e);
            }

            $scope.toggleAdvanced = (e: Event) => {
                $scope.advanced = !$scope.advanced;
                this.suppressEvents(e);
            }

            $scope.toggleHovering = (e: Event) => {
                $scope.hovering = !$scope.hovering;
                this.suppressEvents(e);
            }
        }

        private createBaseLayerModal = ($scope: ILayersScope, $modal, layersService: Services.LayersService): any => {
            var addBaseLayerScope = <IAddLayerModalScope>$scope.$new();
            addBaseLayerScope.addLayer = (name: string, address: string, minZoom: number, maxNativeZoom: number, e: Event) => {
                var decodedAddress = decodeURI(address).replace("{zoom}", "{z}");
                var layer = layersService.addBaseLayer(name, decodedAddress, <L.TileLayerOptions> { minZoom: minZoom, maxNativeZoom: maxNativeZoom, maxZoom: Services.LayersService.MAX_ZOOM });
                layersService.selectBaseLayer(layer);
                this.suppressEvents(e);
            }
            return this.createAddLayerModal($modal, "Add Base Layer", addBaseLayerScope);
        }

        private createOverlayModal = ($scope: ILayersScope, $modal, layersService: Services.LayersService): any => {
            var addOvelayScope = <IAddLayerModalScope>$scope.$new();
            addOvelayScope.addLayer = (name: string, address: string, minZoom: number, maxNativeZoom: number, e: Event) => {
                var decodedAddress = decodeURI(address).replace("{zoom}", "{z}");
                layersService.addOverlay(name, decodedAddress, <L.TileLayerOptions> { minZoom: minZoom, maxNativeZoom: maxNativeZoom, maxZoom: Services.LayersService.MAX_ZOOM });
                this.suppressEvents(e);
            }
            return this.createAddLayerModal($modal, "Add Overlay", addOvelayScope);
        }

        private createRoutePropertiesModal = (routePropertiesScope: IRouteBaseScope, $modal): any => {
            return $modal({
                title: "Route Properties",
                templateUrl: "views/templates/routePropertiesModal.tpl.html",
                show: false,
                scope: routePropertiesScope,
            });
        }

        private createAddLayerModal($modal, title, scope): any {
            return $modal({
                title: title,
                templateUrl: "views/templates/addLayerModal.tpl.html",
                show: false,
                scope: scope,
            });
        }
    }
} 