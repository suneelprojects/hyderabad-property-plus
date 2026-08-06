<?php
/**
 * Floor field -> dropdown (Lower / Middle / Higher).
 *
 * The core HRC plugin renders the Floor control as a free-text/number input.
 * We do NOT modify it. Instead we:
 *   1. Convert the rendered input into a <select> in the admin (same name/id,
 *      so the core save handler keeps working untouched).
 *   2. Sanitize whatever is saved to one of the three allowed bands.
 *   3. Normalize legacy numeric values to bands in the REST output.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

function hrc_flat_floor_choices() {
	return array( 'Lower', 'Middle', 'Higher' );
}

/**
 * Map any stored value (numeric legacy or text) to a band, or '' when unset.
 */
function hrc_flat_floor_normalize( $value ) {
	$value = is_scalar( $value ) ? trim( (string) $value ) : '';
	if ( '' === $value ) {
		return '';
	}
	foreach ( hrc_flat_floor_choices() as $choice ) {
		if ( strcasecmp( $choice, $value ) === 0 ) {
			return $choice;
		}
	}
	if ( is_numeric( $value ) ) {
		$n = (int) $value;
		if ( $n <= 0 )  return '';
		if ( $n <= 6 )  return 'Lower';
		if ( $n <= 14 ) return 'Middle';
		return 'Higher';
	}
	return '';
}

/**
 * All meta keys that may hold the floor value.
 */
function hrc_flat_floor_meta_keys() {
	return array( 'floor', '_floor', 'hrc_flat_floor', '_hrc_flat_floor', '_hrc_floor' );
}

/* -------------------------------------------------------------------------
 * Admin: swap the input for a dropdown (all flat admin screens).
 * ---------------------------------------------------------------------- */

add_action( 'admin_footer', function () {
	$screen = function_exists( 'get_current_screen' ) ? get_current_screen() : null;
	if ( ! $screen || HRC_FLAT_POST_TYPE !== $screen->post_type ) {
		return;
	}

	$current = '';
	if ( ! empty( $_GET['post'] ) ) {
		$pid = (int) $_GET['post'];
		foreach ( hrc_flat_floor_meta_keys() as $mk ) {
			$stored = get_post_meta( $pid, $mk, true );
			$band   = hrc_flat_floor_normalize( $stored );
			if ( '' !== $band ) { $current = $band; break; }
		}
	}
	?>
	<script>
	(function () {
		var CHOICES = <?php echo wp_json_encode( hrc_flat_floor_choices() ); ?>;
		var CURRENT = <?php echo wp_json_encode( $current ); ?>;
		var PLACEHOLDER = '\u2014 Select Floor \u2014';

		function isFloorField(el) {
			var name = (el.getAttribute('name') || '') + ' ' + (el.id || '');
			return /floor/i.test(name) && !/floor[_-]?plan/i.test(name);
		}

		function normalize(v) {
			v = (v == null ? '' : String(v)).trim();
			if (!v) return '';
			for (var i = 0; i < CHOICES.length; i++) {
				if (CHOICES[i].toLowerCase() === v.toLowerCase()) return CHOICES[i];
			}
			var n = parseInt(v, 10);
			if (!isNaN(n)) {
				if (n <= 0) return '';
				if (n <= 6) return 'Lower';
				if (n <= 14) return 'Middle';
				return 'Higher';
			}
			return '';
		}

		function convert(input) {
			if (input.dataset.hrcFloorDone) return;
			var value = normalize(input.value) || CURRENT;
			var select = document.createElement('select');
			select.name = input.getAttribute('name') || '';
			if (input.id) select.id = input.id;
			select.className = input.className;
			select.style.cssText = input.style.cssText;
			if (!select.style.minWidth) select.style.minWidth = '160px';

			var ph = document.createElement('option');
			ph.value = '';
			ph.textContent = PLACEHOLDER;
			select.appendChild(ph);

			CHOICES.forEach(function (c) {
				var o = document.createElement('option');
				o.value = c;
				o.textContent = c;
				if (c === value) o.selected = true;
				select.appendChild(o);
			});

			select.dataset.hrcFloorDone = '1';
			input.parentNode.replaceChild(select, input);
		}

		function run(root) {
			var nodes = (root || document).querySelectorAll('input[type="text"],input[type="number"],input:not([type])');
			Array.prototype.forEach.call(nodes, function (el) {
				if (isFloorField(el)) convert(el);
			});
		}

		if (document.readyState === 'loading') {
			document.addEventListener('DOMContentLoaded', function () { run(document); });
		} else {
			run(document);
		}
		// Handle late-rendered metaboxes (Gutenberg / repeaters).
		var mo = new MutationObserver(function (muts) {
			muts.forEach(function (m) {
				Array.prototype.forEach.call(m.addedNodes, function (n) {
					if (n.nodeType === 1) run(n);
				});
			});
		});
		mo.observe(document.body, { childList: true, subtree: true });
	})();
	</script>
	<?php
}, 99 );

/* -------------------------------------------------------------------------
 * Save: force the stored value into one of the three bands.
 * ---------------------------------------------------------------------- */

add_action( 'save_post_' . HRC_FLAT_POST_TYPE, function ( $post_id ) {
	if ( defined( 'DOING_AUTOSAVE' ) && DOING_AUTOSAVE ) return;
	if ( ! current_user_can( 'edit_post', $post_id ) ) return;

	foreach ( hrc_flat_floor_meta_keys() as $mk ) {
		if ( ! metadata_exists( 'post', $post_id, $mk ) ) continue;
		$stored = get_post_meta( $post_id, $mk, true );
		$band   = hrc_flat_floor_normalize( $stored );
		if ( (string) $stored !== $band ) {
			update_post_meta( $post_id, $mk, $band );
		}
	}
}, 99 );

/* -------------------------------------------------------------------------
 * REST: normalize the `floor` value handed to the frontend.
 * ---------------------------------------------------------------------- */

add_filter( 'hrc_flat_augment_item', function ( array $item ) {
	if ( array_key_exists( 'floor', $item ) ) {
		$item['floor'] = hrc_flat_floor_normalize( $item['floor'] );
	}
	return $item;
} );
